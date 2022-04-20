function doSomething(callback) {
  setTimeout(() => {
    let result = 5;
    callback(result);
  }, 3000);
}

doSomething((myvalue) => {
  console.log("myvalue = " + myvalue);
});

console.log("Nu zijn we hier!");
