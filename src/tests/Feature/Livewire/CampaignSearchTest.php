<?php

namespace Tests\Feature\Livewire;

use App\Livewire\CampaignSearch;
use App\Models\Campaign;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class CampaignSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_render(): void
    {
        Livewire::test(CampaignSearch::class)->assertStatus(200);
    }

    public function test_can_search_campaigns(): void
    {
        Campaign::factory()->create(['title' => 'Bantu Anak Yatim', 'status' => 'Berjalan']);
        Campaign::factory()->create(['title' => 'Renovasi Masjid', 'status' => 'Berjalan']);

        Livewire::test(CampaignSearch::class)
            ->set('search', 'Yatim')
            ->assertSee('Bantu Anak Yatim')
            ->assertDontSee('Renovasi Masjid');
    }

    public function test_can_filter_by_category(): void
    {
        $cat1 = Category::factory()->create(['name' => 'Pendidikan']);
        $cat2 = Category::factory()->create(['name' => 'Kesehatan']);

        Campaign::factory()->create([
            'title' => 'Beasiswa',
            'category_id' => $cat1->id,
            'status' => 'Berjalan',
        ]);
        Campaign::factory()->create([
            'title' => 'Klinik',
            'category_id' => $cat2->id,
            'status' => 'Berjalan',
        ]);

        Livewire::test(CampaignSearch::class)
            ->set('categoryId', $cat1->id)
            ->assertSee('Beasiswa')
            ->assertDontSee('Klinik');
    }

    public function test_only_shows_active_campaigns(): void
    {
        Campaign::factory()->create(['title' => 'Active', 'status' => 'Berjalan']);
        Campaign::factory()->create(['title' => 'Stopped', 'status' => 'Berhenti']);

        Livewire::test(CampaignSearch::class)
            ->assertSee('Active')
            ->assertDontSee('Stopped');
    }
}
