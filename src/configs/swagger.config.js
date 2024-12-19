export const SWAGGER_OPTION = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Nhóm 1 API',
      version: '0.1.0',
      description: 'This is a simple CRUD API application made with Express and documented with Swagger',
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html'
      },
      contact: {
        name: 'Rạng',
        url: 'http://localhost:3000',
        email: 'info@email.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000'
      }
    ]
  },
  apis: ['./src/routes/*.js']
}
