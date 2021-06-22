require("dotenv").config();
// Tyto věci lze měnit
const prefix = "!";
const guild_id = "842524673055916063";
const verified_role_id = "856866661863522334";

const fs = require("fs");
const Discord = require("discord.js");
const client = new Discord.Client();
let roleName = "Ověřeno";

client.on("ready", async () => {
  console.log(`Bot načten ${client.user.tag}!`);
  await client.user.setActivity("si s ověřením #verification");
  roleName = client.guilds.get(guild_id).roles.get(verified_role_id).name;
});

client.on("message", msg => {
  const args = msg.content
    .slice(prefix.length)
    .trim()
    .split(/ +/g);

  const command = args
    .shift()
    .toLowerCase()
    .replace("/", "");

  // cmd verifymsg = vytvoří embed
  if (
    !msg.author.bot &&
    msg.content.indexOf(prefix) === 0 &&
    command === "verifymsg"
  ) {
    // Pokud odesílatel zprávy není vlastníkem guild, zruší akci 
    if (msg.member.guild.ownerID !== msg.member.id) return;

    const introMessageContent = fs.readFileSync("intro-message.md", {
      encoding: "utf8",
      flag: "r"
    });
    const communityGuidelinesContent = fs.readFileSync(
      "community-guidelines.md",
      { encoding: "utf8", flag: "r" }
    );
    const verificationMessageContent = fs.readFileSync(
      "verification-message.md",
      { encoding: "utf8", flag: "r" }
    );

    const embed = new Discord.RichEmbed();

    const welcomeTitle = `Vítej na ${msg.guild.name}!`;

    embed.addField(welcomeTitle, introMessageContent);
    embed.addField("🎗 Zásady komunity", communityGuidelinesContent);
    embed.addField("🔐 Získání ověření", verificationMessageContent);

    msg.channel
      .send({ embed })
      .then(theVerificationMessage => theVerificationMessage.react("857025231817015306"));
    msg.delete();
  }

  return;
});

client.on("messageReactionAdd", ({ message: { channel } }, user) => {
  if (/verification/.test(channel.name)) {
    channel.guild
      .fetchMember(user)
      .then(member => {
        return member.addRole(verified_role_id);
      })
      .then(() => {
        console.log(
          `Role ${roleName} byla úspěšně přidělena uživateli ${user.tag}!`
        );
      })
      .catch(error => {
        console.error(error);
      });
  }
});

client.on("messageReactionRemove", ({ message: { channel } }, user) => {
  if (/verification/.test(channel.name)) {
    channel.guild
      .fetchMember(user)
      .then(member => {
        return member.removeRole(verified_role_id);
      })
      .then(() => {
        console.log(
          `Role ${roleName} byla úspěšně odebrána uživateli ${user.tag}!`
        );
      })
      .catch(error => {
        console.error(error);
      });
  }
});

client.on("raw", ({ d: data, t: event }) => {
  if (["MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE"].includes(event)) {
    const { channel_id, user_id, message_id, emoji } = data;

    const channel = client.channels.get(channel_id);

    if (!channel.messages.has(message_id))
      channel.fetchMessage(message_id).then(message => {
        const reaction = message.reactions.get(
          emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name
        );

        const user = client.users.get(user_id);

        if (reaction) reaction.users.set(user_id, user);

        return client.emit(
          event === "MESSAGE_REACTION_ADD"
            ? "messageReactionAdd"
            : "messageReactionRemove",
          reaction,
          user
        );
      });
  }
});

if (process.env.TOKEN !== null) {
  client.login(process.env.TOKEN);
} else {
  console.error("Bot token je prázdný!");
}
