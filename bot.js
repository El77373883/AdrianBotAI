const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const https = require("https");
const http  = require("http");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️  CONFIGURACIÓN — EDITA CON TUS DATOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CONFIG = {
  token: process.env.TOKEN,

  canalBienvenida: "ID_CANAL_BIENVENIDA",
  canalReglas:     "ID_CANAL_REGLAS",

  serverIP:      "tu.ip.aqui",
  serverVersion: "1.20.x",
  serverNombre:  "Mi Server",
  serverModpack: "Vanilla",

  color:        "#2ECC71",
  colorIA:      "#9B59B6",
  colorImagen:  "#E74C3C",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 REGLAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const REGLAS = [
  "No hagas griefing ni robes a otros jugadores.",
  "Respeta a todos los miembros del servidor.",
  "No uses hacks, cheats ni mods que den ventaja injusta.",
  "No spamees ni floodees en el chat.",
  "Escucha a los admins y moderadores.",
  "Diviértete y sé buena onda. 🎮",
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💬 PALABRAS CLAVE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PALABRAS_CLAVE = {
  "cómo entro":      `Usa la IP: \`${CONFIG.serverIP}\` en Minecraft ${CONFIG.serverVersion} 🎮`,
  "no puedo entrar": `Asegúrate de usar la versión **${CONFIG.serverVersion}** y la IP \`${CONFIG.serverIP}\`.`,
  "está caído":      "Puede estar en mantenimiento. Vuelve en unos minutos. 🔧",
  "está abierto":    `¡Sí! El server está **24/7**. Conéctate con \`${CONFIG.serverIP}\` 🟢`,
  "gratis":          "¡Sí, el server es completamente **gratis**! 🎉",
  "hola":            "¡Hola! 👋 Escribe **!ayuda** para ver lo que puedo hacer.",
  "gracias":         "¡De nada! 😊",
  "lag":             "Si hay lag avisa con tu nombre de usuario. ⚡",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 UTILIDADES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Hace fetch de texto (GET)
function fetchTexto(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    mod.get(url, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

// Hace POST y devuelve texto
function postTexto(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };
    const mod = url.startsWith("https") ? https : http;
    const req = mod.request(url, options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// Descarga imagen como Buffer
function descargarImagen(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    mod.get(url, (res) => {
      // Seguir redirecciones
      if (res.statusCode === 301 || res.statusCode === 302) {
        return descargarImagen(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", reject);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 GENERAR CÓDIGO con Pollinations.ai (gratis)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function generarCodigo(peticion) {
  const prompt = encodeURIComponent(
    `Eres un experto programador. El usuario pide: "${peticion}".
Responde SOLO con el código listo para usar, sin explicaciones largas.
Agrega un comentario breve al inicio diciendo qué hace.
Si es para Minecraft, usa sintaxis de comandos o plugin Bukkit/Spigot.
Si es JavaScript o Python, usa buenas prácticas.
Sé conciso y útil.`
  );

  const url = `https://text.pollinations.ai/${prompt}`;
  const respuesta = await fetchTexto(url);
  return respuesta.trim();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 GENERAR IMAGEN con Pollinations.ai (gratis)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function generarImagen(descripcion) {
  const prompt = encodeURIComponent(descripcion);
  const url = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true`;
  const buffer = await descargarImagen(url);
  return buffer;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚡ COMANDOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function manejarComando(message, comando, args) {
  const texto = args.join(" ");

  switch (comando) {

    // ── CÓDIGO / SCRIPTS ──────────────────────
    case "!codigo":
    case "!script":
    case "!code": {
      if (!texto) {
        await message.reply("❌ Dime qué script quieres. Ejemplo: `!codigo comando ban con mensaje en Minecraft`");
        return;
      }
      const pensando = await message.reply("⏳ Generando tu código, espera...");
      try {
        const codigo = await generarCodigo(texto);

        // Detectar lenguaje para el bloque de código
        let lang = "js";
        if (texto.toLowerCase().includes("python")) lang = "python";
        if (texto.toLowerCase().includes("minecraft") || texto.toLowerCase().includes("plugin")) lang = "java";
        if (texto.toLowerCase().includes("bash") || texto.toLowerCase().includes("shell")) lang = "bash";

        // Si el código es muy largo, dividirlo
        const bloqueMax = 1900;
        const bloques = [];
        let actual = `\`\`\`${lang}\n`;
        for (const linea of codigo.split("\n")) {
          if ((actual + linea + "\n").length > bloqueMax) {
            bloques.push(actual + "```");
            actual = `\`\`\`${lang}\n`;
          }
          actual += linea + "\n";
        }
        bloques.push(actual + "```");

        const embed = new EmbedBuilder()
          .setColor(CONFIG.colorIA)
          .setTitle("💻 Código generado")
          .setDescription(`**Petición:** ${texto}`)
          .setFooter({ text: "Generado con IA • Pollinations.ai" });

        await pensando.edit({ content: "", embeds: [embed] });
        for (const bloque of bloques) {
          await message.channel.send(bloque);
        }
      } catch (e) {
        await pensando.edit("❌ Hubo un error generando el código. Intenta de nuevo.");
        console.error(e);
      }
      break;
    }

    // ── IMAGEN ────────────────────────────────
    case "!imagen":
    case "!image":
    case "!img": {
      if (!texto) {
        await message.reply("❌ Dime qué imagen quieres. Ejemplo: `!imagen un dragón en un server de Minecraft`");
        return;
      }
      const pensando = await message.reply("🎨 Generando tu imagen, espera unos segundos...");
      try {
        const buffer = await generarImagen(texto);
        const adjunto = new AttachmentBuilder(buffer, { name: "imagen.png" });

        const embed = new EmbedBuilder()
          .setColor(CONFIG.colorImagen)
          .setTitle("🎨 Imagen generada")
          .setDescription(`**Descripción:** ${texto}`)
          .setImage("attachment://imagen.png")
          .setFooter({ text: "Generado con IA • Pollinations.ai" });

        await pensando.edit({ content: "", embeds: [embed], files: [adjunto] });
      } catch (e) {
        await pensando.edit("❌ Hubo un error generando la imagen. Intenta de nuevo.");
        console.error(e);
      }
      break;
    }

    // ── INFO SERVER ───────────────────────────
    case "!ip":
    case "!conectar": {
      const embed = new EmbedBuilder()
        .setColor(CONFIG.color)
        .setTitle("🌐 Conexión al Server")
        .addFields(
          { name: "IP",      value: `\`${CONFIG.serverIP}\``, inline: true },
          { name: "Versión", value: CONFIG.serverVersion,      inline: true },
          { name: "Tipo",    value: CONFIG.serverModpack,      inline: true }
        )
        .setFooter({ text: `${CONFIG.serverNombre} • 24/7 Online` });
      await message.reply({ embeds: [embed] });
      break;
    }

    case "!reglas": {
      const lista = REGLAS.map((r, i) => `**${i + 1}.** ${r}`).join("\n");
      const embed = new EmbedBuilder()
        .setColor(CONFIG.color)
        .setTitle("📋 Reglas del Server")
        .setDescription(lista)
        .setFooter({ text: "Romper las reglas puede resultar en ban." });
      await message.reply({ embeds: [embed] });
      break;
    }

    case "!info": {
      const embed = new EmbedBuilder()
        .setColor(CONFIG.color)
        .setTitle(`🎮 ${CONFIG.serverNombre}`)
        .setDescription("¡Bienvenido a nuestro servidor de Minecraft!")
        .addFields(
          { name: "🌐 IP",      value: `\`${CONFIG.serverIP}\``, inline: true },
          { name: "📦 Versión", value: CONFIG.serverVersion,      inline: true },
          { name: "🔧 Tipo",    value: CONFIG.serverModpack,      inline: true },
          { name: "⏰ Horario", value: "24/7",                    inline: true },
          { name: "💰 Precio",  value: "Gratis",                  inline: true }
        )
        .setFooter({ text: "¡Que disfrutes el server! 🎉" });
      await message.reply({ embeds: [embed] });
      break;
    }

    case "!ayuda":
    case "!comandos": {
      const embed = new EmbedBuilder()
        .setColor(CONFIG.color)
        .setTitle("📖 Comandos del Bot")
        .addFields(
          { name: "🤖 IA",       value: "`!codigo [descripción]` → Genera código o scripts\n`!imagen [descripción]` → Genera una imagen", inline: false },
          { name: "🎮 Minecraft", value: "`!ip` → IP del server\n`!reglas` → Reglas\n`!info` → Info general", inline: false },
          { name: "📌 Ejemplos", value:
            "`!codigo script para banear jugadores en Minecraft`\n" +
            "`!codigo bot de Discord en Python que responda hola`\n" +
            "`!imagen un creeper en el espacio`",
            inline: false
          }
        )
        .setFooter({ text: "Powered by Pollinations.ai • Gratis y sin límites" });
      await message.reply({ embeds: [embed] });
      break;
    }

    default:
      break;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👋 BIENVENIDA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
client.on("guildMemberAdd", async (member) => {
  const canal = member.guild.channels.cache.get(CONFIG.canalBienvenida);
  if (!canal) return;

  const embed = new EmbedBuilder()
    .setColor(CONFIG.color)
    .setTitle(`👋 ¡Bienvenido/a, ${member.user.username}!`)
    .setDescription(
      `¡Hola <@${member.id}>! Nos alegra tenerte aquí. 🎉\n\n` +
      `📋 Lee las **<#${CONFIG.canalReglas}>** antes de jugar.\n` +
      `🌐 Conéctate con \`${CONFIG.serverIP}\`\n` +
      `🤖 Escribe **!ayuda** para ver todos los comandos del bot.`
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({ text: `${CONFIG.serverNombre} • ¡Que te diviertas! 🎮` });

  await canal.send({ embeds: [embed] });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 LÓGICA PRINCIPAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
client.once("ready", () => {
  console.log(`✅ Bot online como: ${client.user.tag}`);
  client.user.setActivity("!ayuda | IA gratis 🤖", { type: 3 });
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const texto = message.content.toLowerCase().trim();

  // 1. Comandos
  if (texto.startsWith("!")) {
    const partes  = message.content.trim().split(/\s+/);
    const comando = partes[0].toLowerCase();
    const args    = partes.slice(1);
    await manejarComando(message, comando, args);
    return;
  }

  // 2. Palabras clave
  for (const [palabra, respuesta] of Object.entries(PALABRAS_CLAVE)) {
    if (texto.includes(palabra)) {
      await message.reply(respuesta);
      return;
    }
  }
});

client.login(CONFIG.token);
