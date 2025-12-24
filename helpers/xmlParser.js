const { XMLParser } = require('fast-xml-parser');

const parseXml = async (xmlData) => {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        cdataPropName: "#cdata",
        textNodeName: "#text",
    });

    return parser.parse(xmlData);
}

module.exports = {
    parseXml,
}