const contractQuery = require("./contractQuery")
const { wire, DNSServer } = require("bns-plus");
module.exports = async (req, res, rinfo) => {

    const [question] = req.question;
    let name = question.name.toLowerCase()
    if (config.zones.find(zone => name.endsWith(zone))) {
        let zone = config.zones.find(zone => name.endsWith(zone))
        let nameInfo;
        try {
            let nameInContract = name.slice(0, -zone.length)
            nameInfo = global.cache.get(nameInContract)

            if (!nameInfo) {
                nameInfo = await contractQuery(config.nameContract, {
                    function: "getDomainRecords",
                    domain: nameInContract
                })
                global.cache.set(nameInContract, nameInfo)
            }

            let records = nameInfo
            if (!records.data.execution.result) {
                throw "No name found"
            }

            let dnsrecords = records.data.execution.result?.records
            console.log(dnsrecords)
            dnsrecords.forEach(record => {
                const rr = new wire.Record();
                let fname = record.name == "@" ? name : record.name + "." + name
                rr.name = fname
                rr.type = wire.types[record.type]

                rr.data = ({ "A": () => new wire.ARecord(), "TXT": () => new wire.TXTRecord(), "CNAME": () => new wire.CNAMERecord(), "AAAA": () => new wire.AAAARecord(), "MX": () => new wire.MXRecord() })[record.type]()

                rr.data = record.value
                res.answer.push(rr)

            })

            res.send()
        } catch (e) {
            console.error(e)
            res.code = wire.codes.NXDOMAIN;
            // res.send()
        }

    } else {
        res.code = wire.codes.NXDOMAIN;
        res.send()
    }
}