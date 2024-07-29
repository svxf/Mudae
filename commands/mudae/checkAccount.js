const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readCsv } = require('../../helper');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

module.exports = {
    category: 'mudae',
    data: new SlashCommandBuilder()
        .setName('check_account')
        .setDescription("checks the user's account data")
        .addStringOption(option =>
			option.setName('user')
				.setDescription('specify a user')
				.setAutocomplete(true)
				.setRequired(false)),
    async execute(interaction) {
        const userId = interaction.user.id;
        const userName = interaction.user.username;
        const specifiedUserName = interaction.options.getString('user');

        const usersDatabase = path.join(__dirname, 'data/users.csv');
        const users = await readCsv(usersDatabase);

        let targetUser;
        if (specifiedUserName) {
            targetUser = users.find(user => user.userId === specifiedUserName);
        }
        if (!targetUser) {
            targetUser = users.find(user => user.userId === userId);
        }

        if (targetUser) {
            const balance = targetUser.balance;
            const claimedCharacters = JSON.parse(targetUser.claimedCharacters || "[]");

            const createEmbed = (page) => {
                const startIndex = page * 6;
                const endIndex = Math.min(startIndex + 6, claimedCharacters.length);

                const charactersToShow = claimedCharacters.slice(startIndex, endIndex);
                const charactersList = charactersToShow.map(c => `- ${c.characterName}`).join('\n') || 'None';

                const embed = new EmbedBuilder()
                    .setTitle(`${targetUser.username}'s account information (${claimedCharacters.length})`)
                    .addFields(
                        { name: 'balance', value: `${balance}`, inline: true },
                        { name: 'claimed characters', value: charactersList, inline: true }
                    )
                    .setColor('#0099ff');

                return embed;
            };

            let currentPage = 0;
            const embedMessage = await interaction.reply({ embeds: [createEmbed(currentPage)], fetchReply: true });

            if (claimedCharacters.length > 6) {
                await embedMessage.react('⬅️');
                await embedMessage.react('➡️');

                const filter = (reaction, user) => !user.bot && (reaction.emoji.name === '⬅️' || reaction.emoji.name === '➡️');
                const collector = embedMessage.createReactionCollector({ filter, time: 60000, dipose: true });
                
                collector.on('collect', async (reaction, user) => {
                    if (reaction.emoji.name === '⬅️' && currentPage > 0) {
                        currentPage--;
                    } else if (reaction.emoji.name === '➡️' && currentPage < Math.ceil(claimedCharacters.length / 6) - 1) {
                        currentPage++;
                    }
                    await embedMessage.edit({ embeds: [createEmbed(currentPage)] });
                });

                collector.on('remove', async (reaction, user) => {
                    if (reaction.emoji.name === '⬅️' && currentPage > 0) {
                        currentPage--;
                    } else if (reaction.emoji.name === '➡️' && currentPage < Math.ceil(claimedCharacters.length / 6) - 1) {
                        currentPage++;
                    }
                    await embedMessage.edit({ embeds: [createEmbed(currentPage)] });
                });
                
                // delete reactions after it expires
                collector.on('end', () => {
                    embedMessage.reactions.removeAll().catch(error => console.error('failed to clear reactions: ', error));
                });
            }

        } else {
            await interaction.reply(`no account found for ${specifiedUserName || interaction.user.username}.`);
        }
    },
};