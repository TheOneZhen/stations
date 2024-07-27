function sum(a: number, b: number) {
  if (__DEV__) {
    console.warn('Please do data validation when using this function!')
  }
  return a + b                              
}