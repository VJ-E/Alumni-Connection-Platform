#!/usr/bin/env python3
"""Complete the remaining commits."""

import subprocess
import os

def run_cmd(cmd, cwd=None, check=False, env=None):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd, env=env)
    return result.stdout.strip(), result.returncode

repo_path = '/home/vijay/Stuffs/Projects/Alumni-Connection-Platform'
os.chdir(repo_path)

# Check current commit count
current_count, _ = run_cmd("git log --oneline rewritten-history | wc -l", cwd=repo_path)
current_count = int(current_count.strip())
print(f"Current commits: {current_count}")

# Read remaining commits (from index 137 onwards, 0-indexed)
commits = []
with open('/tmp/rewrite_commits.txt', 'r') as f:
    for line in f:
        parts = line.strip().split('|')
        if len(parts) >= 8:
            idx = int(parts[0])
            if idx >= current_count:  # Start from where we left off
                commits.append({
                    'idx': parts[0],
                    'original_hash': parts[1],
                    'author': parts[2],
                    'email': parts[3],
                    'date_str': parts[4],
                    'message': parts[5],
                    'split_idx': int(parts[6]),
                    'split_total': int(parts[7])
                })

print(f"Processing {len(commits)} remaining commits...")

for i, commit in enumerate(commits, current_count + 1):
    print(f"Commit {i}/150: {commit['message'][:50]}...")
    
    original_hash = commit['original_hash']
    
    # Get all files from this commit
    files_cmd = f"git diff-tree --no-commit-id --name-only -r {original_hash}"
    files, _ = run_cmd(files_cmd, check=False)
    
    if files:
        file_list = [f for f in files.split('\n') if f.strip()]
        # Apply a subset of files for this split
        split_idx = commit['split_idx']
        split_total = commit['split_total']
        
        if file_list:
            files_per_split = max(1, len(file_list) // split_total)
            start_idx = split_idx * files_per_split
            if split_idx == split_total - 1:
                files_to_apply = file_list[start_idx:]
            else:
                files_to_apply = file_list[start_idx:start_idx + files_per_split]
            
            for file_path in files_to_apply:
                if file_path:
                    run_cmd(f"git checkout {original_hash} -- '{file_path}'", check=False)
    
    # Stage and commit
    run_cmd("git add -A", check=False)
    
    # Check if there are changes
    _, code = run_cmd("git diff --cached --quiet", check=False)
    if code != 0:
        date_str = commit['date_str']
        env = os.environ.copy()
        env['GIT_AUTHOR_NAME'] = commit['author']
        env['GIT_AUTHOR_EMAIL'] = commit['email']
        env['GIT_AUTHOR_DATE'] = f"{date_str} +0530"
        env['GIT_COMMITTER_NAME'] = commit['author']
        env['GIT_COMMITTER_EMAIL'] = commit['email']
        env['GIT_COMMITTER_DATE'] = f"{date_str} +0530"
        
        if commit['split_total'] > 1:
            commit_msg = f"{commit['message']} (part {commit['split_idx'] + 1}/{commit['split_total']})"
        else:
            commit_msg = commit['message']
        
        commit_msg_escaped = commit_msg.replace("'", "'\"'\"'")
        run_cmd(f"git commit -m '{commit_msg_escaped}' --allow-empty", env=env, check=False)
    else:
        # No changes, create empty commit
        date_str = commit['date_str']
        env = os.environ.copy()
        env['GIT_AUTHOR_NAME'] = commit['author']
        env['GIT_AUTHOR_EMAIL'] = commit['email']
        env['GIT_AUTHOR_DATE'] = f"{date_str} +0530"
        env['GIT_COMMITTER_NAME'] = commit['author']
        env['GIT_COMMITTER_EMAIL'] = commit['email']
        env['GIT_COMMITTER_DATE'] = f"{date_str} +0530"
        
        if commit['split_total'] > 1:
            commit_msg = f"{commit['message']} (part {commit['split_idx'] + 1}/{commit['split_total']})"
        else:
            commit_msg = commit['message']
        
        commit_msg_escaped = commit_msg.replace("'", "'\"'\"'")
        run_cmd(f"git commit --allow-empty -m '{commit_msg_escaped}'", env=env, check=False)

final_count, _ = run_cmd("git log --oneline rewritten-history | wc -l", cwd=repo_path)
print(f"\nComplete! Total commits: {final_count.strip()}")

