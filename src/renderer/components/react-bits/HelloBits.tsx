import React from 'react'
import './hello-bits.css'

export const HelloBits: React.FC = () => {
  return (
    <div className="hello-bits">
      <span className="hello-bits__pulse" />
      <span className="hello-bits__text">React Bits ready (TS-CSS)</span>
    </div>
  )
}

export default HelloBits
