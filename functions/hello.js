exports.handler = async (e, context) => {

   return {
      statusCode: 200,
      body: JSON.stringify({ message: "Hello World" })
   }
}