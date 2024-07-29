const { Events } = require('discord.js');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand())
		{
			const command = interaction.client.commands.get(interaction.commandName);
	
			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}
	
			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(error);
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
				} else {
					await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
				}
			}
		} else if (interaction.isAutocomplete()) {
			const focusedOption = interaction.options.getFocused(true);
            if (focusedOption.name === 'user') {
				const command = interaction.client.commands.get(interaction.commandName);
                if (!command) {
                    return;
                }

                const includeAllOption = command.includeAllOption;

                const userDatabase = path.join(__dirname, '../commands/mudae/data/users.csv');

                const users = await new Promise((resolve, reject) => {
                    const results = [];
                    fs.createReadStream(userDatabase)
                        .pipe(csv())
                        .on('data', (data) => results.push(data))
                        .on('end', () => resolve(results))
                        .on('error', (error) => reject(error));
                });

                const filteredUsers = users
                    .filter(user => user.username.toLowerCase().includes(focusedOption.value.toLowerCase()))
                    .map(user => ({ name: user.username, value: user.userId }));

				if (includeAllOption) {
					filteredUsers.push({ name: 'all', value: 'all' });
				}

                await interaction.respond(filteredUsers);
            }
		}
	},
};