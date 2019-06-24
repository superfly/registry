module.exports = {
  success: (body, type = "text/html") => ({
    status: "200",
    body,
    headers: {
      "Content-Type": [
        {
          key: "Content-Type",
          value: type
        }
      ]
    }
  }),
  notFound: () => ({
    status: "404",
    headers: {
      "Content-Type": [
        {
          key: "Content-Type",
          value: "text/plain"
        }
      ]
    },
    body: "Not Found\r\n"
  }),
  redirect: dest => ({
    status: "302",
    headers: {
      location: [
        {
          key: "Location",
          value: dest
        }
      ],
      "access-control-allow-origin": [
        {
          key: "Access-Control-Allow-Origin",
          value: "*"
        }
      ]
    }
  })
};
