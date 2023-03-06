const htmlmin = require('html-minifier');
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const markdownIt = require("markdown-it");
const Image = require("@11ty/eleventy-img");
const path = require('path');

function eleventyConfig(config) {
	// Passthroughs
	config.addPassthroughCopy("src/img");
	config.addPassthroughCopy("src/Blog/.attachments");

	// Layout aliases
	config.addLayoutAlias("base", "layouts/base.njk");


// --- START, eleventy-img
function imageShortcode(src, alt, sizes="(min-width: 1024px) 100vw, 50vw") {
	console.log(`Generating image(s) from:  ${src}`)
	let options = {
		widths: [600, 900, 1500],
		formats: ["webp", "jpeg"],
		//urlPath: "/Blog/",
		outputDir: "./dist/img/",
		filenameFormat: function (id, src, width, format, options) {
			const extension = path.extname(src)
			const name = path.basename(src, extension)
			return `${name}-${width}w.${format}`
		}
	}

	// generate images
	Image(src, options)

	let imageAttributes = {
		alt,
		sizes,
		loading: "lazy",
		decoding: "async",
	}
	// get metadata
	metadata = Image.statsSync(src, options)
	return Image.generateHTML(metadata, imageAttributes)
}
// --- END, eleventy-img




	// Minify HTML
	const isProduction = process.env.ELEVENTY_ENV === "production";

	var htmlMinify = function(value, outputPath) {
		if (outputPath && outputPath.indexOf('.html') > -1) {
			return htmlmin.minify(value, {
				useShortDoctype: true,
				removeComments: true,
				collapseWhitespace: true,
				minifyCSS: true
			});
		}
	}
	const md = new markdownIt({
		html: true
	});
	
	//config.addShortcode("image", imageShortcode)
	config.addPairedShortcode("markdown", (content) => {
		return md.render(content);
	});

	// html min only in production
	if (isProduction) {
		config.addTransform("htmlmin", htmlMinify);
	}
	
	config.addPlugin(eleventyNavigationPlugin);

	// Configuration
	return {
		dir: {
			input: "src",
			output: "dist",
			includes: "includes",
			data: "data",
		},
		templateFormats: ["html", "njk", "md", "11ty.js"],
		htmlTemplateEngine: "njk",
		markdownTemplateEngine: "njk",
	};
};

module.exports = eleventyConfig;