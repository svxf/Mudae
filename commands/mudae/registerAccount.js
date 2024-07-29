const { SlashCommandBuilder } = require('discord.js');
const { readCsv } = require('../../helper')

const fs = require('fs');
const path = require('path');

const csv = require('csv-parser');
const { stringify } = require('csv-stringify/sync');

module.exports = {
	category: 'mudae',
	data: new SlashCommandBuilder()
		.setName('register')
		.setDescription('registers your account'),
	async execute(interaction) {
		const userId = interaction.user.id;
		const username = interaction.user.username;
		const usersDatabase = path.join(__dirname, 'data/users.csv');
		const users = await readCsv(usersDatabase);

		const existingUser = users.find(user => user.userId === userId);

		if (existingUser) {
			await interaction.reply(`you already have an account, ${username}`);
		} else {
			const newUser = { userId, username, balance: 100 };
			users.push(newUser);

			const csvData = stringify(users, { header: true });
			fs.writeFileSync(usersDatabase, csvData);

			await interaction.reply(`account for ${username} created successfully!\nyour balance is 100`);
		}
	},
};