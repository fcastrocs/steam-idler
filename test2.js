
let res = getFromDatabase("JM2")
console.log(res)
console.log("2")

function getFromDatabase(nick){
  // use timeout to simulate database fetch
  setTimeout(()=>{
    //fetch somewith from database with nick
    // send result in callback
    return "1"
  }, 3000)

}