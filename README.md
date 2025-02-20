### NOTES

- some fonts in the design appear to be using a semiBold font weight (600). this font was not present in the files I was sent so i just used bold weight instead (700)

- in the dist folder i dont know how to optimise font files - im sure i can learn the on the job (thats whats blowing out the bundle size). 

- scripts and scss is minified with gulp.

- not sure why but the images were exporting at a very low quality from figma. i didnt have time to troubleshoot this, but im sure there is a reasonable solution


### Development

- script to run when in development

`yarn gulp`

- to build for production

`gulp build`

will build a development bundle into the dist folder
