const { VCardBuilder } = require("wp-heart");

module.exports = {
    name: "owner",
    aliases: ["creator", "developer"],
    category: "info",
    code: async (ctx) => {
        try {
            const mainVcard = new VCardBuilder()
                .setFullName(config.owner.name)
                .setOrg(config.owner.organization)
                .setNumber(config.owner.id)
                .build();

            const coOwners = Array.isArray(config.owner.co) && config.owner.co.length > 0
                ? config.owner.co.map(co => ({
                    displayName: co.name,
                    vcard: new VCardBuilder()
                        .setFullName(co.name)
                        .setOrg(co.organization || config.owner.organization)
                        .setNumber(co.id)
                        .build()
                }))
                : [];

            const contacts = [
                { displayName: config.owner.name, vcard: mainVcard },
                ...coOwners
            ];

            await ctx.reply({
                contacts: {
                    displayName: coOwners.length > 0 ? "Bot Owner & Co-Owners" : config.owner.name,
                    contacts
                }
            });
        } catch (err) {
            await tools.cmd.handleError(ctx, err);
        }
    }
};
