<x-dashboard-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">Edit Campaign</h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <form action="{{ route('dashboard.campaigns.update', $campaign) }}" method="POST" enctype="multipart/form-data">
                    @csrf
                    @method('PUT')
                    <!-- Form fields placeholder -->
                    <p class="text-gray-500">Campaign edit form - to be styled in Task 12</p>
                    <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded mt-4">Perbarui</button>
                </form>
            </div>
        </div>
    </div>
</x-dashboard-layout>
