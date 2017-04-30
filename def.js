
function detectWeb(doc, url) {
 
	if (url.indexOf("fr/agenda") != -1) {
		return "agenda";
	} else if (url.indexOf("fr/espace-juridique") != -1) {
		return "Article";
	}
}

function doWeb(doc, url) {
var namespace = doc.documentElement.namespaceURI; 
var nsResolver = namespace ? function(prefix) {
if (prefix == 'x') return namespace; else return null; 
} : null; 

var articles = new Array();
var items = new Object();
var nextTitle; 

if (detectWeb(doc, url) == "agenda") {
var titles = doc.evaluate('//td[2]/a', doc, nsResolver, XPathResult.ANY_TYPE, null); 
while (nextTitle = titles.iterateNext()) {
items[nextTitle.href] = nextTitle.textContent; 
}
items = Zotero.selectItems(items); 
for (var i in items) {
articles.push(i); 
}
} else {
//saves single page items
articles = [url]; 
} 

//Tells Zotero to process everything. Calls the "scrape" function to do the dirty work.
Zotero.Utilities.processDocuments(articles, scrape, function(){Zotero.done();});
Zotero.wait();
//Translator is FINISHED after running this line. Note: code doesn't run from top to bottom only.
}

//The function used to save well formatted data to Zotero
function associateData (newItem, items, field, zoteroField) {
if (items[field]) {
newItem[zoteroField] = items[field]; 
}
}

function scrape(doc, url) {
//namespace code
var namespace = doc.documentElement.namespaceURI; 
var nsResolver = namespace ? function(prefix) {
if (prefix == 'x') return namespace; else return null; 
} : null; 

//variable declarations
var newItem = new Zotero.Item('book'); 
newItem.url = doc.location.href; 
newItem.title = "Aucun titres";

var items = new Object();
var headers; 
var contents; 
var blankCell = "temp";
var headersTemp; 
var tagsContent = new Array();

var myXPathObject = doc.evaluate('//td[1]', doc, nsResolver, XPathResult.ANY_TYPE, null); 
var myXPathObject2 = doc.evaluate('//td[2]', doc, nsResolver, XPathResult.ANY_TYPE, null); 

//While Loop to populate "items" Object and save tags to an Array.
while (headers = myXPathObject.iterateNext()) {

headersTemp = headers.textContent; 
if (!headersTemp.match(/\w/)) {
headersTemp = blankCell; 
blankCell = blankCell + "1";
}

contents = myXPathObject2.iterateNext().textContent; 
if (headersTemp.match("temp")) {
tagsContent.push(contents); 
}

items[headersTemp.replace(/\s+/g, '')]=contents.replace(/^\s*|\s*$/g, ''); 
}

//Formatting and saving "Author" field
if (items["PrincipalAuthor:"]) {
var author = items["PrincipalAuthor:"]; 
if (author.match("; ")) {
var authors = author.split("; ");
for (var i in authors) {
newItem.creators.push(Zotero.Utilities.cleanAuthor(authors[i], "author"));
}
} else {
newItem.creators.push(Zotero.Utilities.cleanAuthor(author, "author"));
}
}

//Formatting and saving "Imprint" fields
if (items["Imprint:"]) {
items["Imprint:"] = items["Imprint:"].replace(/\s\s+/g, ''); 

if (items["Imprint:"].match(":")) {
var colonLoc = items["Imprint:"].indexOf(":");
newItem.place = items["Imprint:"].substr(1, colonLoc-1); 

var commaLoc = items["Imprint:"].lastIndexOf(",");
var date1 =items["Imprint:"].substr(commaLoc + 1); 
newItem.date = date1.substr(0, date1.length-1); 
newItem.publisher = items["Imprint:"].substr(colonLoc+1, commaLoc-colonLoc-1); 
} else {
newItem.publisher = items["Imprint:"]; 
}
}

//Saving the tags to Zotero
if (items["Subjects:"]) {
tagsContent.push(items["Subjects:"]); 
}
for (var i = 0; i < tagsContent.length; i++) {
newItem.tags[i] = tagsContent[i]; 
}

//Associating and saving the well formatted data to Zotero
associateData (newItem, items, "Title:", "title");
associateData (newItem, items, "ISBN-10:", "ISBN");
associateData (newItem, items, "Collection:", "extra");
associateData (newItem, items, "Pages:", "pages");

newItem.repository = "Loi";

//Scrape is COMPLETE!
newItem.complete();
}