const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readCsv, getRandomColor } = require('../../helper')
const fs = require('fs');
const path = require('path');

const csv = require('csv-parser');
const { stringify } = require('csv-stringify/sync');

module.exports = {
    type: 'messageCreate',
    name: 'roll',
	async execute(message) {
        if (!message.content.startsWith('$roll')) return;
        const chanceOfCustom = 0.15; // might be too high idk, u chose ur own value

        // checks if user has an account
        const userId = message.author.id;
        const username = message.author.username;
		const userDatabase = path.join(__dirname, 'data/users.csv');
		const users = await readCsv(userDatabase);

		const existingUser = users.find(user => user.userId === userId);
        if (existingUser) {
            const userBalance = parseInt(existingUser.balance, 10);

            if (userBalance < 10) {
                await message.reply('insufficient balance. you need at least 10 to roll.');
                return;
            }

            existingUser.balance = (userBalance - 10).toString();

            // update the user's balance
            const updatedUsers = users.map(user => user.userId === userId ? existingUser : user);
            const updatedCsv = stringify(updatedUsers, { header: true });
            fs.writeFileSync(userDatabase, updatedCsv);

            // roll a character
            const isCustomCharacter = Math.random() < chanceOfCustom;
            let randomCharacter;

            if (isCustomCharacter) {
                const customCharactersDatabase = path.join(__dirname, 'data/custom_characters.csv');
                const customCharacters = await readCsv(customCharactersDatabase);

                if (customCharacters.length > 0) {
                    randomCharacter = customCharacters[Math.floor(Math.random() * customCharacters.length)];
                } else {
                    // found no custom characters
                    const charactersDatabase = path.join(__dirname, 'data/characters.csv');
                    const characters = await readCsv(charactersDatabase);
                    randomCharacter = characters[Math.floor(Math.random() * characters.length)];
                }
            } else {
                const charactersDatabase = path.join(__dirname, 'data/characters.csv');
                const characters = await readCsv(charactersDatabase);
                randomCharacter = characters[Math.floor(Math.random() * characters.length)];
            }

            // check if it was claimed
            const allClaimedCharacters = users.flatMap(user => JSON.parse(user.claimedCharacters || "[]"));
            const claimedCharacter = allClaimedCharacters.find(c => c.characterName === randomCharacter.Name);
            let footerText = 'React with any emoji to claim this character!';
            if (claimedCharacter) {
                footerText = `Claimed by ${claimedCharacter.userName}`;
            }

            const embed = new EmbedBuilder()
                .setTitle(randomCharacter.Name)
                .setImage(randomCharacter.PFP)
                .addFields(
                    { name: 'Rank', value: `#${randomCharacter.Rank}`, inline: true },
                    { name: 'Age', value: `${randomCharacter.Age}`, inline: true }
                )
                .setColor(getRandomColor())
                .setFooter({ text: footerText });
            
            const sentMessage = await message.reply({ embeds: [embed] });
            await sentMessage.react('🐦');
            
            // listener
            const filter = (reaction, user) => !user.bot;
            const collector = sentMessage.createReactionCollector({ filter, max: 1, time: 60000 }); // only listen for a minute

            collector.on('collect', async (reaction, user) => {
                const alreadyClaimed = allClaimedCharacters.find(c => c.characterName === randomCharacter.Name);
                if (!alreadyClaimed) {
                    const newClaim = {
                        characterName: randomCharacter.Name,
                        characterPFP: randomCharacter.PFP,
                        userId: user.id,
                        userName: user.username,
                        timestamp: new Date().toISOString()
                    };

                    const updatedUsers = users.map(user => {
                        if (user.userId === userId) {
                            const claimedCharacters = JSON.parse(user.claimedCharacters || "[]");
                            claimedCharacters.push(newClaim);
                            user.claimedCharacters = JSON.stringify(claimedCharacters);
                        }
                        return user;
                    });

                    const updatedCsv = stringify(updatedUsers, { header: true });
                    fs.writeFileSync(userDatabase, updatedCsv);

                    await sentMessage.edit({ 
                        embeds: [new EmbedBuilder(embed)
                            .setFooter({ text: `Claimed by ${user.username}` })] 
                    });
                    await message.reply(`you have claimed ${randomCharacter.Name}!`);
                } else {
                    await message.reply('this character has already been claimed.');
                }
            });

        } else {
            await message.reply(`no account found for ${username}`);
        }
	},
};