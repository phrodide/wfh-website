const htmlmin = require('html-minifier');
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const markdownIt = require("markdown-it");

function eleventyConfig(config) {
	// Passthroughs
	config.addPassthroughCopy("src/img");

	// Layout aliases
	config.addLayoutAlias("base", "layouts/base.njk");

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