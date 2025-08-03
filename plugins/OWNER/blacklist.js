const config = require("@config");
const { reply, extractNumber } = require("@lib/utils");
const { findUser, updateUser, addUser } = require("@lib/users");
const { isOwner, isPremiumUser } = require("@lib/users");

async function handle(sock, messageInfo) {
  const { m, prefix, remoteJid, command, content, mentionedJid, message } =
    messageInfo;

  try {
    // Validasi input kosong
    if (!content || !content.trim()) {
      return await reply(
        m,
        `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} 628xxx*_
                
_Fitur *blacklist* akan membuat user akan di kick di semua grub (wajib .on detectblacklist2)_`
      );
    }

    // Tentukan nomor target
    let targetNumber = (mentionedJid?.[0] || content).replace(/\D/g, "");
    let originalNumber = targetNumber;

    // Validasi format nomor (10-15 digit)
    if (!/^\d{10,15}$/.test(targetNumber)) {
      return await reply(
        m,
        `_Nomor tidak valid. Pastikan formatnya benar_\n\n_Contoh: *${
          prefix + command
        } 628xxx*_`
      );
    }

    targetNumber = extractNumber(targetNumber);
    const botNumber = extractNumber(config.phone_number_bot);

    if (botNumber == targetNumber) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _Tidak dapat blacklist nomor bot_` },
        { quoted: message }
      );
    }

    if (await isOwner(targetNumber)) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _Tidak dapat blacklist nomor owner_` },
        { quoted: message }
      );
    }

    // Ambil data user dari database
    const dataUsers = await findUser(targetNumber);

    if (!dataUsers) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _Pengguna dengan nomor/tag tersebut tidak ditemukan._` },
        { quoted: message }
      );
    }

    const [docId, userData] = dataUsers;

    // Perbarui status pengguna menjadi "blacklist"
    await updateUser(targetNumber, { status: "blacklist" });
    return await reply(
      m,
      `_✅ Nomor ${originalNumber} berhasil di blacklist!_\n\n` +
        `_⚠️ Info: Nomor yang telah di blacklist akan terdeteksi apabila ada di sebuah grub dan fitur sudah aktif_ \n
_(.on detectblacklist)_ hanya peringatan
_(.on detectblacklist2)_ kick member`
    );
  } catch (error) {
    console.error("Error handling command:", error);
    return await reply(
      m,
      `_Terjadi kesalahan saat memproses permintaan. Silakan coba lagi nanti._`
    );
  }
}

module.exports = {
  handle,
  Commands: ["blacklist"],
  OnlyPremium: false,
  OnlyOwner: true,
};
