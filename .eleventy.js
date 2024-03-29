const { DateTime } = require("luxon");
const htmlmin = require('html-minifier');
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const markdownIt = require("markdown-it");
const Image = require("@11ty/eleventy-img");
const path = require('path');
const sharp = require('sharp');
const htmlparser2 = require('htmlparser2');

function eleventyConfig(config) {
	// Passthroughs
	config.addPassthroughCopy("src/img");
	config.addPassthroughCopy("src/Blog/.attachments");
	config.addPassthroughCopy("src/PDFs");

	// Layout aliases
	config.addLayoutAlias("base", "layouts/base.njk");
	const mdShortcode = new markdownIt({
		html: true
	});

	config.addPairedShortcode("markdown", (content) => {
		return mdShortcode.render(content);
	});

	


	//Start
	const markdown = markdownIt()
	markdown.renderer.rules.image = function (tokens, idx, options, env, self) {
		function figure(html, caption) {
			return `<figure>${html}<figcaption>${caption}</figcaption></figure>`
		}

		const token = tokens[idx]
		let imgSrc = token.attrGet('src')
		const imgAlt = token.content
		const imgTitle = token.attrGet('title')

		const htmlOpts = { alt: imgAlt, loading: 'lazy', decoding: 'async' }
		imgSrc = path.normalize(path.join(path.parse(env.page.inputPath).dir, imgSrc))
		console.log(`Generating image(s) from:  ${imgSrc}`)

		const parsed = (imgTitle || '').match(
			/^(?<skip>@skip(?:\[(?<width>\d+)x(?<height>\d+)\])? ?)?(?:\?\[(?<sizes>.*?)\] ?)?(?<caption>.*)/
		).groups

		if (parsed.skip || imgSrc.startsWith('http')) {
			const options = { ...htmlOpts }
			if (parsed.sizes) {
				options.sizes = parsed.sizes
			}

			const metadata = { jpeg: [{ url: imgSrc }] }
			if (parsed.width && parsed.height) {
				metadata.jpeg[0].width = parsed.width
				metadata.jpeg[0].height = parsed.height
			}

			const generated = Image.generateHTML(metadata, options)

			if (parsed.caption) {
				return figure(generated, parsed.caption)
			}
			return generated
		}

		const widths = [250]
		const imgOpts = {
			widths: widths
				.concat(widths.map((w) => w * 2)) // generate 2x sizes
				.filter((v, i, s) => s.indexOf(v) === i), // dedupe
			formats: ['webp', 'jpeg'], // TODO: add avif when support is good enough
			outputDir: './dist/img/'
		}

		Image(imgSrc, imgOpts)

		const metadata = Image.statsSync(imgSrc, imgOpts)

		const generated = Image.generateHTML(metadata, {
			sizes: parsed.sizes || '(max-width: 768px) 100vw, 768px',
			...htmlOpts
		})

		if (parsed.caption) {
			return figure(generated, parsed.caption)
		}
		return generated
	}
	//End

	config.addCollection("posts", function (collection) {
		return collection.getFilteredByGlob("src/Blog/*.md");
	});

	config.addFilter("head", (array, n) => {
		if (!Array.isArray(array) || array.length === 0) {
			return [];
		}
		if (n < 0) {
			return array.slice(n);
		}

		return array.slice(0, n);
	});

	config.addFilter("readableDate", (dateObj, format, zone) => {
		// Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
		return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(format || "dd LLLL yyyy");
	});

	config.addFilter("wfh_currency", (number) => {
		const cformatter = new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		  
			// These options are needed to round to whole numbers if that's what you want.
			//minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
			//maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
		  });
		  return cformatter.format(number);
	});

	config.addFilter('htmlDateString', (dateObj) => {
		// dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
		return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd');
	});

	// Minify HTML
	const isProduction = process.env.ELEVENTY_ENV === "production";

	var htmlMinify = function (value, outputPath) {
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

	config.setLibrary('md', markdown)
	config.addPairedShortcode("markdown", (content) => {
		return md.render(content);
	});


	config.addShortcode("excerpt", (article) =>	extractExcerpt(article));

	config.addPairedShortcode("wfhbanner", (content) => {
		const widths = [768,992,1280,1600,1920];
		const srcBanner = 'src/img/portfolio6.jpg';
		const sharpBannerOptions = { fit: sharp.fit.cover, position: "left top" };
		var srcset = "";
		//Render the banner to auto size
		for (var i=0; i < widths.length; i++)
		{
			sharp(srcBanner).resize(widths[i],620,sharpBannerOptions).toFile('dist/img/banner-' + widths[i] + '.jpg');
			if (srcset.length!=0)
			{
				srcset += ", ";
			}
			srcset += "img/banner-" + widths[i] + ".jpg " + widths[i] + "w";
		}
		return "<img class='img-fluid' src='img/banner-" + widths[0] + ".jpg' srcset='" + srcset + "' alt='luminarias' style='margin:0'>";
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

function extractExcerpt(article) {
    if (!Object.prototype.hasOwnProperty.call(article, "templateContent")) {
        console.warn(
            'Failed to extract excerpt: Document has no property "templateContent".'
        );
        return null;
    }

    const content = article.templateContent;  
	const dom = htmlparser2.parseDocument(content);
	const firstP = htmlparser2.DomUtils.findOne(function (elem) {
		return elem.name==='p';
	},dom.childNodes);
	const text = htmlparser2.DomUtils.innerText(firstP);
	const firstH = htmlparser2.DomUtils.findOne(function (elem) {
		return elem.name==='h1';
	},dom.childNodes);
	const header = htmlparser2.DomUtils.innerText(firstH);
	const firstImg = htmlparser2.DomUtils.findOne(function (elem) {
		return elem.name==='source' && elem.attribs["srcset"].includes(".jpeg 250w");
	},dom.childNodes);
	var img = firstImg.attribs["srcset"];
	img = img.slice(0,img.indexOf(" 250w"));

    const excerpt = "<div class=\"col-md-3\"><img src=\"" + img + "\"></div><div class=\"col-md-8\"><h2>" + header + "</h2><p>" + text + "</p></div>";

    return excerpt;
}

module.exports = eleventyConfig;