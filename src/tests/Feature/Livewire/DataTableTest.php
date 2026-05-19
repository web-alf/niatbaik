<?php

namespace Tests\Feature\Livewire;

use App\Livewire\DataTable;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class DataTableTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_render_data_table(): void
    {
        Livewire::test(DataTable::class, [
            'model' => Category::class,
            'columns' => [['field' => 'name', 'label' => 'Name']],
        ])->assertStatus(200);
    }

    public function test_can_search(): void
    {
        Category::factory()->create(['name' => 'Pendidikan']);
        Category::factory()->create(['name' => 'Kesehatan']);

        Livewire::test(DataTable::class, [
            'model' => Category::class,
            'columns' => [['field' => 'name', 'label' => 'Name']],
        ])
            ->set('search', 'Pendidikan')
            ->assertSee('Pendidikan')
            ->assertDontSee('Kesehatan');
    }

    public function test_can_sort(): void
    {
        Category::factory()->create(['name' => 'Alpha']);
        Category::factory()->create(['name' => 'Bravo']);

        $component = Livewire::test(DataTable::class, [
            'model' => Category::class,
            'columns' => [['field' => 'name', 'label' => 'Name']],
        ])
            ->call('sortBy', 'name')
            ->assertSeeInOrder(['Alpha', 'Bravo']);
    }

    public function test_sort_toggles_direction(): void
    {
        Livewire::test(DataTable::class, [
            'model' => Category::class,
            'columns' => [['field' => 'name', 'label' => 'Name']],
        ])
            ->call('sortBy', 'name')
            ->assertSet('sortDirection', 'asc')
            ->call('sortBy', 'name')
            ->assertSet('sortDirection', 'desc');
    }

    public function test_search_resets_pagination(): void
    {
        Livewire::test(DataTable::class, [
            'model' => Category::class,
            'columns' => [['field' => 'name', 'label' => 'Name']],
        ])
            ->set('search', 'test')
            ->assertSet('search', 'test');
    }

    public function test_can_filter(): void
    {
        Category::factory()->create(['name' => 'FilterMe', 'slug' => 'filter-me']);
        Category::factory()->create(['name' => 'Other', 'slug' => 'other']);

        Livewire::test(DataTable::class, [
            'model' => Category::class,
            'columns' => [['field' => 'name', 'label' => 'Name']],
            'filters' => ['slug' => 'filter-me'],
        ])
            ->assertSee('FilterMe')
            ->assertDontSee('Other');
    }
}
