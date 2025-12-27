const { XMLParser } = require('fast-xml-parser');

const { horoscopeApi } = require('../const/env');

const parseXml = async (xmlData) => {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        cdataPropName: "#cdata",
        textNodeName: "#text",
    });

    return parser.parse(xmlData);
}

const fetchHoroscopeData = async () => {
    const serviceResponse = await fetch(horoscopeApi);
    const serviceData = await serviceResponse.text();
    return await parseXml(serviceData);
};

module.exports = {
    parseXml,
    fetchHoroscopeData,
}