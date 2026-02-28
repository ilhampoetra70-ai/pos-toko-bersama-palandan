import React, { useEffect } from 'react';
import { Barcode, LayoutGrid, ReceiptText, PieChart, Search, Bell, Utensils, Coffee, CakeSlice, Beef, IceCream, Plus, Minus, Hash, User, Banknote } from 'lucide-react';
import { RetroBox, RetroUsers, RetroSettings, RetroLogout } from '../components/RetroIcons';
import { useNavigate } from 'react-router-dom';

export default function MockupPage() {
    const navigate = useNavigate();

    useEffect(() => {
        // Dynamically inject Google Fonts for the mockup
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        return () => {
            document.head.removeChild(link);
        };
    }, []);

    return (
        <div style={{ fontFamily: "'Outfit', sans-serif" }} className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden antialiased">

            {/* SIDEBAR */}
            <aside className="w-[100px] bg-card border-r border-slate-200 flex flex-col items-center py-6 shrink-0 z-10 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-2xl flex items-center justify-center text-white mb-10 shadow-lg shadow-indigo-500/30">
                    <Barcode size={24} />
                </div>

                <nav className="flex flex-col gap-4 w-full items-center">
                    <button onClick={() => navigate('/')} className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 text-white bg-indigo-600 shadow-xl shadow-indigo-600/25 transition-all hover:-translate-y-1">
                        <LayoutGrid size={22} />
                        <span className="text-[11px] font-medium">Kasir</span>
                    </button>

                    {[
                        { icon: ReceiptText, label: "Transaksi" },
                        { icon: RetroBox, label: "Produk" },
                        { icon: RetroUsers, label: "Pelanggan" },
                        { icon: PieChart, label: "Laporan" }
                    ].map((item, idx) => (
                        <button key={idx} className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all hover:-translate-y-1">
                            <item.icon size={22} />
                            <span className="text-[11px] font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <nav className="flex flex-col gap-4 w-full items-center mt-auto">
                    <button className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all hover:-translate-y-1">
                        <RetroSettings size={22} />
                        <span className="text-[11px] font-medium">Setting</span>
                    </button>
                    <button onClick={() => navigate('/')} className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 text-red-500 hover:bg-red-50 transition-all hover:-translate-y-1">
                        <RetroLogout size={22} />
                        <span className="text-[11px] font-medium">Keluar</span>
                    </button>
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col p-8 pb-0 overflow-y-auto scrollbar-hide">

                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Kasir Point of Sale</h1>
                        <p className="text-sm text-slate-500">Selasa, 18 Februari 2025 • Shift Siang</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-card px-5 py-3 rounded-full shadow-sm border border-transparent focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-100 transition-all w-80">
                            <Search size={20} className="text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari produk SKU atau nama..."
                                className="border-none outline-none bg-transparent w-full ml-3 text-sm text-slate-800 placeholder:text-slate-400"
                            />
                        </div>
                        <button className="w-11 h-11 rounded-full bg-card border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-600 transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="w-11 h-11 rounded-full p-0.5 border-2 border-indigo-100 overflow-hidden cursor-pointer hover:border-indigo-300 transition-colors">
                            <img src="https://ui-avatars.com/api/?name=Kasir+Satu&background=4F46E5&color=fff" alt="User" className="w-full h-full rounded-full" />
                        </div>
                    </div>
                </header>

                {/* Categories */}
                <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-none">
                    <button className="px-6 py-2.5 rounded-full bg-indigo-600 text-white border border-indigo-600 text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-600/20 whitespace-nowrap">
                        <Utensils size={16} /> Semua Produk
                    </button>
                    {[
                        { icon: Coffee, label: "Minuman" },
                        { icon: CakeSlice, label: "Camilan" },
                        { icon: Beef, label: "Makanan Berat" },
                        { icon: IceCream, label: "Dessert" }
                    ].map((cat, idx) => (
                        <button key={idx} className="px-6 py-2.5 rounded-full bg-card text-slate-500 border border-slate-200 text-sm font-medium flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors whitespace-nowrap">
                            <cat.icon size={16} /> {cat.label}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-8">
                    {[
                        { name: "Kopi Susu Aren", cat: "Minuman", price: "Rp 22.000", img: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=300&h=200" },
                        { name: "Ice Matcha Latte", cat: "Minuman", price: "Rp 28.000", img: "https://images.unsplash.com/photo-1572490122747-3968b75bf699?auto=format&fit=crop&q=80&w=300&h=200" },
                        { name: "Classic Beef Burger", cat: "Makanan Berat", price: "Rp 45.000", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=300&h=200" },
                        { name: "French Fries", cat: "Camilan", price: "Rp 20.000", img: "https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&q=80&w=300&h=200" },
                        { name: "Red Velvet Cake", cat: "Dessert", price: "Rp 32.000", img: "https://images.unsplash.com/photo-1623065422900-03399454c2cb?auto=format&fit=crop&q=80&w=300&h=200" },
                        { name: "Lemon Tea Ice", cat: "Minuman", price: "Rp 15.000", img: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&q=80&w=300&h=200" },
                        { name: "Dimsum Ayam", cat: "Camilan", price: "Rp 25.000", img: "https://images.unsplash.com/photo-1600803907087-f56d462fd26b?auto=format&fit=crop&q=80&w=300&h=200" }
                    ].map((prod, idx) => (
                        <div key={idx} className="group bg-card rounded-2xl p-4 border border-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200 hover:border-indigo-200 cursor-pointer flex flex-col relative overflow-hidden">
                            <div className="w-full h-32 bg-slate-100 rounded-xl mb-4 overflow-hidden">
                                <img src={prod.img} alt={prod.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-slate-800 mb-1 leading-tight">{prod.name}</h3>
                                <p className="text-xs text-slate-400 mb-3">{prod.cat}</p>
                            </div>
                            <div className="flex justify-between items-center mt-auto">
                                <span className="text-lg font-bold text-indigo-600">{prod.price}</span>
                                <button className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:text-white active:scale-95">
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* CART SIDEBAR */}
            <aside className="w-[380px] bg-card border-l border-slate-200 flex flex-col shrink-0 z-10">
                <div className="p-8 pb-6 border-b border-dashed border-slate-200">
                    <h2 className="text-2xl font-bold mb-2">Pesanan Saat Ini</h2>
                    <div className="flex justify-between text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5"><Hash size={16} /> INV-250218-001</span>
                        <span className="flex items-center gap-1.5"><User size={16} /> Tamu</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
                    {[
                        { name: "Kopi Susu Aren", price: "Rp 22.000", qty: 2, img: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80" },
                        { name: "Classic Beef Burger", price: "Rp 45.000", qty: 1, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80" }
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                                <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[15px] font-semibold text-slate-800 mb-1">{item.name}</h4>
                                <span className="text-sm font-medium text-slate-500">{item.price}</span>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-lg">
                                <button className="w-7 h-7 rounded-md bg-card border border-slate-200 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-300 shadow-sm active:scale-90 transition-all">
                                    <Minus size={14} strokeWidth={2.5} />
                                </button>
                                <span className="text-sm font-semibold w-4 text-center">{item.qty}</span>
                                <button className="w-7 h-7 rounded-md bg-card border border-slate-200 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-300 shadow-sm active:scale-90 transition-all">
                                    <Plus size={14} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-card border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                    <div className="flex justify-between text-[15px] text-slate-500 mb-3 font-medium">
                        <span>Subtotal (3 item)</span>
                        <span className="text-slate-800">Rp 89.000</span>
                    </div>
                    <div className="flex justify-between text-[15px] text-slate-500 mb-3 font-medium">
                        <span>Diskon (0%)</span>
                        <span className="text-red-500">- Rp 0</span>
                    </div>
                    <div className="flex justify-between text-[15px] text-slate-500 mb-4 font-medium">
                        <span>Pajak PB1 (10%)</span>
                        <span>Rp 8.900</span>
                    </div>

                    <div className="flex justify-between text-[20px] font-bold text-slate-900 pt-4 border-t border-dashed border-slate-200 mb-6">
                        <span>Total</span>
                        <span>Rp 97.900</span>
                    </div>

                    <button className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold flex items-center justify-between shadow-xl shadow-indigo-600/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-600/40 active:translate-y-0 transition-all">
                        <span className="flex items-center gap-2 text-base">
                            <Banknote size={20} /> Bayar Sekarang
                        </span>
                        <span className="bg-card/20 px-3 py-1 rounded-lg text-sm tracking-wide">
                            Rp 97.900
                        </span>
                    </button>
                </div>
            </aside>

        </div>
    );
}
