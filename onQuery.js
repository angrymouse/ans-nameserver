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
            records.data.execution.result.A.forEach(aRecord => {

                const rr = new wire.Record();

                rr.name = name;
                rr.type = wire.types.A;
                rr.ttl = 3600;
                rr.data = new wire.ARecord();
                rr.data.address = aRecord.value
                res.answer.push(rr)
            })
            // res.records.map()
            // records.forEach(record => {
            //     const rr = new wire.Record();

            //     rr.name = name;
            //     rr.type = wire.types.NS;
            //     rr.ttl = 3600;
            //     rr.data = new wire.NSRecord();
            //     rr.data.ns = record.value.endsWith(".") ? record.value : record.value + "."
            //     res.authority.push(rr)
            // })
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