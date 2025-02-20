var gulp = require("gulp");
var sass = require("gulp-sass")(require("sass"));
var plumber = require("gulp-plumber");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var sourcemaps = require("gulp-sourcemaps");
var fs = require("fs").promises;

var paths = {
  images: {
    src: 'assets/images/**/*',
    dest: 'dist/assets/images'
  },
  fonts: {
    src: 'assets/fonts/**/*',
    dest: 'dist/assets/fonts'
  }
};

async function css() {
  const autoprefixer = (await import("gulp-autoprefixer")).default;

  return gulp
    .src(["scss/main.scss"])
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(
      sass
        .sync({
          outputStyle: "compressed",
          precision: 10,
          includePaths: [".", "node_modules"],
        })
        .on("error", sass.logError)
    )
    .pipe(
      autoprefixer({
        cascade: false,
        overrideBrowserslist: require("./package.json").browserslist,
      })
    )
    .pipe(concat("main.css"))
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest("src"));
}

var jsAppFiles = ["js/**/*.js"],
  jsDest = "src";
function mainScripts() {
  return gulp.src(jsAppFiles)
    .pipe(sourcemaps.init())
    .pipe(concat("main.js"))
    .pipe(uglify())
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest(jsDest));
}

function copyFonts() {
  return gulp.src(paths.fonts.src)
    .pipe(gulp.dest(paths.fonts.dest));
}

function copyImages() {
  return gulp.src(paths.images.src)
    .pipe(gulp.dest(paths.images.dest));
}

async function injectFiles() {
  try {
    await fs.mkdir('dist', { recursive: true });
    
    let htmlContent = await fs.readFile('index.html', 'utf8');
    const cssContent = await fs.readFile('src/main.css', 'utf8');
    let jsContent = await fs.readFile('src/main.js', 'utf8');

    jsContent = `document.addEventListener('DOMContentLoaded', function() {
      ${jsContent}
    });`;

    const styleTag = `<style>
      /* Font faces */
      @font-face {
        font-family: 'Specsavers';
        src: url('assets/fonts/specsavers-web-regular.otf') format('opentype');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'Specsavers';
        src: url('assets/fonts/specsavers-web-medium.otf') format('opentype');
        font-weight: 500;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'Specsavers';
        src: url('assets/fonts/specsavers-web-bold.otf') format('opentype');
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }
      ${cssContent}
    </style>`;
    
    const scriptTag = `<script defer>${jsContent}</script>`;

    htmlContent = htmlContent.replace(/<link[^>]*data-build-remove[^>]*>/g, '');
    htmlContent = htmlContent.replace(/<script[^>]*data-build-remove[^>]*><\/script>/g, '');
    htmlContent = htmlContent.replace('</head>', `${styleTag}\n${scriptTag}\n</head>`);
    htmlContent = htmlContent.replace(/\.\/assets\//g, 'assets/');

    await fs.writeFile('dist/index.html', htmlContent);
    console.log('Files successfully injected into HTML');
  } catch (error) {
    console.error('Error processing files:', error);
  }
}

// Watch files
async function watchFiles() {
  gulp.watch("scss/**/*.scss", gulp.series(css, injectFiles));
  gulp.watch("js/**/*.js", gulp.series(mainScripts, injectFiles));
  gulp.watch("index.html", injectFiles);
  gulp.watch(paths.images.src, copyImages);
  gulp.watch(paths.fonts.src, copyFonts);
}

// define complex tasks
const build = gulp.series(
  gulp.parallel(css, mainScripts, copyImages, copyFonts),
  injectFiles
);
const watch = gulp.parallel(build, watchFiles);

// exports
exports.build = build;
exports.watch = watch;
exports.default = watch;