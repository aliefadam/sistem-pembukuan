<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\BusinessSetting;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login_and_login_page_uses_inertia(): void
    {
        $this->get('/')->assertRedirect(route('login'));

        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Auth/Login'));
    }

    public function test_active_user_can_log_in_and_log_out(): void
    {
        $user = User::factory()->create([
            'email' => 'owner@example.test',
            'password' => 'secret-password',
            'role' => 'owner',
        ]);

        $this->post(route('login'), [
            'email' => $user->email,
            'password' => 'secret-password',
        ])->assertRedirect(route('dashboard'));

        $this->assertAuthenticatedAs($user);
        $this->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('App')
                ->where('auth.user.role', 'owner'));

        $this->post(route('logout'))->assertRedirect(route('login'));
        $this->assertGuest();
    }

    public function test_inactive_user_cannot_log_in(): void
    {
        $user = User::factory()->create([
            'password' => 'secret-password',
            'status' => 'inactive',
        ]);

        $this->from(route('login'))->post(route('login'), [
            'email' => $user->email,
            'password' => 'secret-password',
        ])->assertRedirect(route('login'))
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_database_seeder_creates_configured_owner_and_default_data(): void
    {
        config([
            'app.admin.name' => 'Pemilik',
            'app.admin.email' => 'owner@example.test',
            'app.admin.password' => 'secret-password',
        ]);

        $this->seed();

        $this->assertDatabaseHas('users', [
            'email' => 'owner@example.test',
            'role' => 'owner',
            'status' => 'active',
        ]);
        $this->assertDatabaseCount('categories', 14);
        $this->assertInstanceOf(BusinessSetting::class, BusinessSetting::firstOrFail());
    }
}
