<x-app-layout>
    <x-slot name="title">Kalkulator Zakat</x-slot>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h1 class="text-2xl font-bold text-gray-800 mb-6">Kalkulator Zakat</h1>
                    <livewire:calculator />
                </div>
            </div>
            <div class="lg:col-span-1">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-lg font-semibold text-gray-800 mb-4">Tentang Zakat</h2>
                    <div class="space-y-4 text-sm text-gray-600">
                        <div>
                            <h3 class="font-semibold text-gray-700 mb-1">Zakat Penghasilan</h3>
                            <p>Zakat yang dikeluarkan dari penghasilan profesi bila telah mencapai nishab. Besarnya 2,5% dari penghasilan.</p>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-700 mb-1">Zakat Emas & Perak</h3>
                            <p>Emas yang telah mencapai nishab 85 gram dan dimiliki selama 1 tahun wajib dikeluarkan zakatnya sebesar 2,5%.</p>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-700 mb-1">Zakat Tabungan</h3>
                            <p>Tabungan yang tersimpan selama 1 tahun dan mencapai nishab (setara 85 gram emas) wajib dikeluarkan zakatnya 2,5%.</p>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-700 mb-1">Zakat Perdagangan</h3>
                            <p>Harta dari perdagangan yang sudah mencapai nishab dan haul. Besarnya 2,5% dari nilai barang dagangan.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
