import { useState } from 'react'

function Board () {
  const [squares, set_squares] = useState(Array(9).fill(''))

  function handleClick () {
    const next = squares.slice()
    next[0] = 'X'
    set_squares(next)
  }

  return 
}

function Square ({ value, handleClick}) {
  return (
    <button className="square" onClick={handleClick}>{ value }</button>
  )
}