import React from 'react'
import { Input } from './ui/input'

const SearchInput = () => {
  return (
    <div>
        <Input 
        type="text" 
        placeholder="Search and Connect......" 
        className="w-80 bg-accent/50 focus:bg-background focus-visible:ring-2 focus-visible:ring-ring"
        />
    </div>
  )
}

export default SearchInput