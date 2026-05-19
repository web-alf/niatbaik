<x-app-layout>
    <x-slot name="title">{{ $page->title }}</x-slot>
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 mb-8">{{ $page->title }}</h1>
        <div class="prose max-w-none">{!! $page->body !!}</div>
    </div>
</x-app-layout>
