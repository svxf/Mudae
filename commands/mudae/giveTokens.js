const { SlashCommandBuilder } = require('discord.js');
const { readCsv, writeCsv } = require('../../helper')
const { stringify } = require('csv-stringify/sync');

const path = require('path');
const fs = require('fs');

module.exports = {
	category: 'mudae',
	data: new SlashCommandBuilder()
		.setName('give_tokens')
		.setDescription('gives a user tokens')
		.addStringOption(option =>
			option.setName('user')
				.setDescription('specify a user')
				.setAutocomplete(true)
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('amount')
				.setDescription('amount of tokens to give')
				.setRequired(true)),
	async execute(interaction) {
        const amount = interaction.options.getInteger('amount');

		// checks if user has an account
		const userOption = interaction.options.getString('user');
		const userDatabase = path.join(__dirname, 'data/users.csv');
		const users = await readCsv(userDatabase);

		let userUpdated = false;
		let targetedUsername = "";
        const updatedUsers = users.map(user => {
            if (user.userId === userOption) {
                let balance = parseInt(user.balance, 10);
                if (isNaN(balance)) balance = 0;

                balance += amount;
                user.balance = balance.toString();
				targetedUsername = user.username;
                userUpdated = true;
            }
            return user;
        });

        if (userUpdated) {
            const updatedCsv = stringify(updatedUsers, { header: true });
            fs.writeFileSync(userDatabase, updatedCsv);

            await interaction.reply(`gave ${targetedUsername} ${amount} credits! their balance is now ${updatedUsers.find(user => user.userId === userOption).balance}`);
        } else {
            await interaction.reply(`${targetedUsername} does not have an existing account.`);
        }
	},
};