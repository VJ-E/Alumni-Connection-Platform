import { Info } from 'lucide-react'
import React from 'react'

interface NAVITEMS {
  heading: string,
  subHeading: string
}
const newsItems: NAVITEMS[] = [
  {
    heading: "E-retailer retag health drinks",
    subHeading: "4h ago - 345 readers"
  },
  {
    heading: "Lets transport raises $22 million",
    subHeading: "4h ago - 323 readers"
  },
  {
    heading: "Casual waer is in at India Inc",
    subHeading: "4h ago - 234 readers"
  },
  {
    heading: "Snaller cities go on loans",
    subHeading: "4h ago - 112 readers"
  },
]

const News = () => {
  return (
    <div className='hidden md:block w-[25%] bg-card text-card-foreground h-fit rounded-lg border border-border'>
      <div className='flex items-center justify-between p-3'>
        <h1 className='font-medium'>Alumni News</h1>
        <Info size={18} />
      </div>
      <div>
{
  newsItems.map((item, index)=>{
    return (
      <div key={index} className='px-3 py-2 hover:bg-accent hover:cursor-pointer transition-colors'>
        <h1 className='text-sm font-medium text-foreground'>{item.heading}</h1>
        <p className='text-xs text-muted-foreground'>{item.subHeading}</p>
      </div>
    )
  })
}
      </div>
      
    </div>
  )
}

export default News