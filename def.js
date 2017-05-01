function detectWeb(doc, url) {
    if (/\d{8}$/.test(url)) {
       if (url.indexOf("fr/agenda") != -1) {
		return "agenda";
	} else if (url.indexOf("fr/espace-juridique") != -1) {
		return "Article de  loi";
	}
    }
    if (getSearchResults(doc, true)) {
        return "multiple";
    }
}

function getSearchResults(doc, checkOnly) {
    var items = {};
    var found = false;
    var rows = ZU.xpath(doc, '//a[h3[@class="titre"]]');
    for (var i=0; i<rows.length; i++) {
        var href = rows[i].href;
        var title = ZU.trimInternal(rows[i].textContent);
        if (!href || !title) continue;
        if (checkOnly) return true;
        found = true;
        items[href] = title;
    }
    return found ? items : false;
}


function doWeb(doc, url) {
    if (detectWeb(doc, url) == "multiple") {
        Zotero.selectItems(getSearchResults(doc, false), function (items) {
            if (!items) {
                return true;
            }
            var articles = [];
            for (var i in items) {
                articles.push(i);
            }
            ZU.processDocuments(articles, scrape);
        });
    } else {
        scrape(doc, url);
    }
}

function scrape(doc, url) {
    
    var itemType = detectWeb(doc, url);
    
    var translator = Zotero.loadTranslator('web');
    // Embedded Metadata
    translator.setTranslator('951c027d-74ac-47d4-a107-9c3069ab7b48');
    translator.setDocument(doc);
    
    translator.setHandler('itemDone', function (obj, item) {
        
        //add date and time if missing by one of three attempts:
        // 1. look at the json-ld data
        // 2. calculate it from the data-seconds attribute
        // 3. extract it from a nonstandard meta field
        var jsonld = ZU.xpathText(doc, '//script[@type="application/ld+json"]');
        var data = JSON.parse(jsonld);
        //Z.debug(data);
        if (data && data.datePublished) {
            item.date = data.datePublished;
        } else {
            var seconds = ZU.xpathText(doc, '(//div[h1 or h2]//*[contains(@class, "date")]/@data-seconds)[1]');
            if (!item.date && seconds) {
                //Z.debug(seconds);
                var date = new Date(1000*seconds);
                item.date = date.toISOString();
            } else {
                item.date = ZU.xpathText(doc, '//meta[@property="rnews:datePublished"]/@content');
            }
        }
        
        
        item.creators = [];
       
        var authorString = ZU.xpathText(doc, '//span[@class="byline__name"]');
        var webpageTitle = ZU.xpathText(doc, '//h1');
        if (authorString) {
            authorString = authorString.replace('By', '').replace('...', '');
            var authors = authorString.split('&');
            for (var i=0; i<authors.length; i++) {
                if (webpageTitle.toLowerCase().indexOf(authors[i].trim().toLowerCase())>-1) {
                    continue;
                }
                item.creators.push(ZU.cleanAuthor(authors[i], "author"));
            }
        }
        
        item.language = "fr-FR";
        
        item.complete();
    });
    
    translator.getTranslatorObject(function(trans) {
        trans.itemType = itemType;
        trans.doWeb(doc, url);
    });

}
