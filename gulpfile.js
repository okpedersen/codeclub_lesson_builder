/*
 * # DEPENDENCIES #
 */
var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload; // reload shorthand
var path = require('path');
var gutil = require('gulp-util');
var addsrc = require('gulp-add-src');
var del = require('del');
var run = require('run-sequence');
<<<<<<< HEAD
var request = require('request');
var async = require('async');
=======
var merge = require('merge-stream');
var _ = require('lodash');
>>>>>>> 12efb8b390fcfbbec05ef4f9365622198ac969fc
// html building
var build = require('./build'); // build.js in same folder
// styles and scripts
var less = require('gulp-less');
var concat = require('gulp-concat');
var autoprefixer = require('gulp-autoprefixer');
var minify = require('gulp-minify-css');
var uglify = require('gulp-uglify');
// archive
var zip = require('gulp-zip');
var fs = require("fs");


/*
 * # VARIABLES #
 */
var lessonRoot = '..';
var buildRoot = path.join(lessonRoot, 'build');
var assetsDest = path.join(buildRoot, 'assets'); // shorthand
var dataDest = path.join(assetsDest, 'data');

/*
 * # TASKS #
 */

/*
 * Create archive files for each subdir of buildRoot
 * Each archive includes all assets.
 */
gulp.task('archive', function() {
  var src_dirs = fs.readdirSync(buildRoot).filter(function(file) {
    return fs.statSync(path.join(buildRoot, file)).isDirectory();
  });
  var streams = _.map(src_dirs, function (dirname){
    if (dirname == 'assets') {
      return;
    }
    return gulp.src([
          buildRoot + '/index.html',
          buildRoot + '/{assets,assets/**}',
          buildRoot + '/{'+dirname+','+dirname+'/**}',
          ])
      .pipe(zip(dirname + '.zip'))
      .pipe(gulp.dest(buildRoot));
  });
  streams = _.compact(streams);
  return merge(streams);
});

/*
 * serve build directory
 */
gulp.task('server', ['build', 'css', 'js', 'assets'], function () {
  browserSync.init({
    server: { baseDir: buildRoot }
  });
});

function download_files(urls) {
  var stream = require('through')(function(file, enc, cb) {
      this.push(file);
      cb();
  });

  urls.forEach(function(url) {
    request(url.url, function(error, response, body) {
      if(!error && (response.statusCode==200 || response.statusCode==304)) {
        stream.queue(
          new gutil.File({
            path:url.filename,
            contents: new Buffer(body)
          })
        )
      } else {
          console.log("Download failed");
      }
    });
  });
  return stream;
}

gulp.task('udir', function(cb) {
  download_files([
    {filename: 'kompetansemaal.json', url:'http://data.udir.no/kl06/kompetansemaal.json'},
    {filename: 'fagkoder.json', url:'http://data.udir.no/kl06/fagkoder'},
  ]).pipe(gulp.dest(dataDest));
  cb();
});



/*
 * build less files to css, prefix and minify
 */
gulp.task('css', function(cb) {
  return gulp.src('styles/*.less')
    .pipe(less())
    .on('error', cb)
    .pipe(addsrc([
      'node_modules/scratchblocks2/build/scratchblocks2.css'
    ]))
    .pipe(autoprefixer())
    .pipe(minify())
    .pipe(concat('style.min.css'))
    .pipe(gulp.dest(assetsDest));
});

/*
 * copy all assets to build directory
 */
gulp.task('assets', function(){
  return gulp.src([
      'assets/**/*',
      'node_modules/scratchblocks2/build/*/*.png',
      'node_modules/bootstrap/dist/*/glyphicons-halflings-regular.*',
      'node_modules/jquery/dist/jquery.min.map'
    ])
    .pipe(gulp.dest(assetsDest));
});

/*
 * concat and uglify scripts
 */
gulp.task('js', function(){
  return gulp.src([
    'scripts/**/*.js',
    'node_modules/scratchblocks2/build/scratchblocks2.js',
    'node_modules/scratchblocks2/src/translations.js'
  ])
  .pipe(uglify())
  .pipe(addsrc.prepend([
    'node_modules/jquery/dist/jquery.min.js'
  ]))
  .pipe(concat('script.min.js'))
  .pipe(gulp.dest(assetsDest));
});

/*
 * metalsmith building
 */
gulp.task('build', build);

/*
 * dist - build all without serving
 */
gulp.task('dist', function(cb){
  // preferred way to this will change in gulp 4
  // see https://github.com/gulpjs/gulp/issues/96
  run('clean',
      ['assets', 'build', 'css', 'js'],
      'archive',
      cb);
});

/*
 * clean - remove files in build directory
 */
gulp.task('clean', function(cb){
  del([path.join(lessonRoot, 'build')], {force: true}, cb);
});

/*
 * # DEFAULT TASK #
 * do metalsmith build
 * build, concat and minify styles
 * concat and uglify scripts
 * copy assets
 * serve build directory with livereload
 * watch files -> build and reload upon changes
 */
gulp.task('default', ['server'], function(){
  /*
   * ## WATCHES ##
   */
  // files which are built with metalsmith
  gulp.watch(path.join(lessonRoot, 'src', '**'), ['build', reload]);
  gulp.watch(path.join(__dirname, 'templates', '**'), ['build', reload]);

  // styles
  gulp.watch(path.join(__dirname, 'styles', '**', '*'), ['css', reload]);

  // scripts
  gulp.watch(path.join(__dirname, 'scripts', '**'), ['js', reload]);

  // assets
  gulp.watch(path.join(__dirname, 'assets', '**'), ['assets', reload]);
});
