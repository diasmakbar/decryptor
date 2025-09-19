# Decrypto

## 🎮 Tujuan Game
Decrypto adalah game **tim vs tim** (minimal 2 tim, masing-masing 2+ pemain).  
Setiap tim berusaha mengomunikasikan kode rahasia **tanpa membuat lawan bisa menebaknya**, sambil mencoba **mendengarkan dan menebak kode lawan**.

---

## 📝 Setup
- Setiap tim memiliki **4 kata kunci** (ditampilkan di layar/di meja).  
- Kartu kode berisi **urutan angka 1-4** (contoh: `2-4-1`).  
- Seorang pemain di tiap tim menjadi **Encryptor** dan memberi 3 clue untuk merepresentasikan kode.  
- Rekan satu tim harus menebak kode urutannya.

---

## 🔄 Jalannya Ronde
1. **Encryptor** melihat kartu kode rahasia (misal: `2-4-1`).  
2. Encryptor memberi **3 clue kata** sesuai urutan kode (cluenya mereferensikan kata kunci ke-2, lalu ke-4, lalu ke-1).  
3. **Tim sendiri** mencoba menebak urutan kode → jika benar, lanjut.  
4. **Tim lawan** juga mencoba menebak kode tim tersebut (berdasarkan clue yang sudah diberikan sepanjang permainan).  

---

## 🧮 Sistem Skoring
- **Miscommunication Token (Kesalahan)**  
  - Jika tim **salah menebak kode mereka sendiri**, mereka mendapat **minus 1 poin**.  
  - **minus 2 poin = Tim kalah.**  

- **Intercept Token (Intersepsi)**  
  - Jika tim lawan berhasil **menebak kode tim lain dengan benar**, mereka mendapat **1 poin positif**.  
  - **2 poin positif = Tim menang.**  

- Game langsung selesai saat ada tim yang memenuhi salah satu kondisi di atas.  

---

## 🏆 Kondisi Menang
- **Menang**: Tim pertama yang mendapat **2 poin positif**.  
- **Kalah**: Tim yang mendapat **minus 2 poin**.

---

## 📌 Ringkasan Cepat
- Tebak kode tim sendiri dengan benar → aman.  
- Salah tebak kode sendiri → dapat Miscommunication.  
- Berhasil tebak kode lawan → dapat Intercept.  
- 2× Intercept = Menang.  
- 2× Miscommunication = Kalah.  

---

## Selamat bermain **Decrypto**!

