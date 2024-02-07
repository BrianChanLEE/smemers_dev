// // /** @type {import('next').NextConfig} */
// // import {createRequire} from 'module';
// // const require = createRequire(import.meta.url);
// // const nextSwaggerDoc = require('next-swagger-doc');

// // const swaggerConfig = nextSwaggerDoc({
// //   title: 'smembers API Documentation',
// //   version: '1.0.0',
// //   apiFolder: 'app/api',
// // });
// // const nextConfig = {
// //   ...swaggerConfig,
// // };

// // async function loadSwaggerConfig() {
// //   const nextSwagger = await import('next-swagger-doc');
// //   return nextSwagger.default({
// //     title: 'smembers API Documentation',
// //     version: '1.0.0',
// //     apiFolder: 'app/api',
// //   });
// // }

// // const swaggerConfig = await loadSwaggerConfig();

// // const nextConfig = {
// //   ...swaggerConfig,
// // };
// // export default nextConfig;
// import nextSwagger from 'next-swagger-doc';

// const swaggerConfig = nextSwagger({
//   title: 'smembers API Documentation',
//   version: '1.0.0',
//   apiFolder: 'app/api',
// });

// const nextConfig = {
//   ...swaggerConfig,
// };

// module.exports = nextConfig;
