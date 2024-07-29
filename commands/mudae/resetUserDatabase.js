const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readCsv } = require('../../helper')
const { stringify } = require('csv-stringify/sync');

const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

module.exports = {
    category: 'mudae',
	data: new SlashCommandBuilder()
		.setName('reset_user_database')
		.setDescription('Resets the user(s) database')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option =>
			option.setName('user')
				.setDescription('specify a user or type "all" to reset all users')
				.setAutocomplete(true)
				.setRequired(true)),
	includeAllOption: true,
	async execute(interaction) {
		const userOption = interaction.options.getString('user');
		const userDatabase = path.join(__dirname, 'data/users.csv');
		const users = await readCsv(userDatabase);

		let updatedUsers;
        let username;

        if (userOption === 'all') {
            updatedUsers = [];
            username = 'all users';
        } else {
            const userToReset = users.find(user => user.userId === userOption);
            if (userToReset) {
                username = userToReset.username;
                updatedUsers = users.filter(user => user.userId !== userOption);
            } else {
                updatedUsers = users;
                username = userOption;
            }
        }

        const updatedCsv = stringify(updatedUsers, { header: true });
        fs.writeFileSync(userDatabase, updatedCsv);

		await interaction.reply({
            content: userOption === 'all' ? 'all users have been reset.' : `user ${username} has been reset.`,
		});
	},
};