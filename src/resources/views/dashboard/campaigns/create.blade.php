<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">Buat Campaign</h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <form action="{{ route('dashboard.campaigns.store') }}" method="POST" enctype="multipart/form-data">
                    @csrf
                    <!-- Form fields placeholder -->
                    <p class="text-gray-500">Campaign form - to be styled in Task 12</p>
                    <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded mt-4">Simpan</button>
                </form>
            </div>
        </div>
    </div>
</x-app-layout>
