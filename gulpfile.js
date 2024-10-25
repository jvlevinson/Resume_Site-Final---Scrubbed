const gulp = require('gulp');
const csso = require('gulp-csso');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const sass = require('gulp-sass')(require('sass')); // Updated for gulp-sass to use the 'sass' package
const plumber = require('gulp-plumber');
const cp = require('child_process');
const imagemin = require('gulp-imagemin');
const browserSync = require('browser-sync').create();

const jekyllCommand = (/^win/.test(process.platform)) ? 'jekyll.bat' : 'bundle';

/*
 * Build the Jekyll Site
 */
function jekyllBuild(done) {
    return cp.spawn(jekyllCommand, ['exec', 'jekyll', 'build'], {stdio: 'inherit'})
        .on('close', done);
}

/*
 * Rebuild Jekyll & reload browserSync
 */
function jekyllRebuild(done) {
    return gulp.series(jekyllBuild, function (done) {
        browserSync.reload();
        done();
    })(done);
}

/*
 * Build the Jekyll site and launch browser-sync
 */
function browserSyncServe(done) {
    browserSync.init({
        server: {
            baseDir: '_site'
        }
    });
    done();
}

/*
 * Compile and minify Sass
 */
function styles() {
    return gulp.src('src/styles/**/*.scss')
        .pipe(plumber())
        .pipe(sass().on('error', sass.logError))
        .pipe(csso())
        .pipe(gulp.dest('assets/css/'))
        .pipe(browserSync.stream());
}

/*
 * Compile fonts
 */
function fonts() {
    return gulp.src('src/fonts/**/*.{ttf,woff,woff2}')
        .pipe(plumber())
        .pipe(gulp.dest('assets/fonts/'))
        .pipe(browserSync.stream());
}

/*
 * Minify images
 */
function images() {
    return gulp.src('src/img/**/*.{jpg,png,gif}')
        .pipe(plumber())
        .pipe(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }))
        .pipe(gulp.dest('assets/img/'))
        .pipe(browserSync.stream());
}

/**
 * Compile and minify JS
 */
function scripts() {
    return gulp.src('src/js/**/*.js')
        .pipe(plumber())
        .pipe(concat('main.js'))
        .pipe(uglify())
        .pipe(gulp.dest('assets/js/'))
        .pipe(browserSync.stream());
}

/*
 * Watch files for changes
 */
function watchFiles() {
    gulp.watch('src/styles/**/*.scss', styles);
    gulp.watch('src/js/**/*.js', scripts);
    gulp.watch('src/fonts/**/*.{ttf,woff,woff2}', fonts);
    gulp.watch('src/img/**/*.{jpg,png,gif}', images);
    gulp.watch(['*.html', '_includes/*.html', '_layouts/*.html'], jekyllRebuild);
}

/*
 * Define complex tasks
 */
const build = gulp.series(jekyllBuild, gulp.parallel(styles, fonts, images, scripts));
const watch = gulp.parallel(watchFiles, browserSyncServe);

/*
 * Export tasks
 */
exports.styles = styles;
exports.fonts = fonts;
exports.images = images;
exports.scripts = scripts;
exports.jekyllBuild = jekyllBuild;
exports.jekyllRebuild = jekyllRebuild;
exports.browserSyncServe = browserSyncServe;
exports.build = build;
exports.watch = watch;
exports.default = gulp.series(build, watch);
