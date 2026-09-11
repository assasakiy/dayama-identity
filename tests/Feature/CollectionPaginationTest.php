<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CollectionPaginationTest extends TestCase
{
    use RefreshDatabase;

    public function test_collections_paginate_on_server_and_retain_query(): void
    {
        $admin = User::factory()->create(['status' => 'active', 'is_primary_super_admin' => true]);
        User::factory()->count(21)->create(['name' => 'Matching user', 'status' => 'active']);
        $role = Role::create(['name' => 'Collection reader']);
        foreach (['users', 'roles', 'permissions'] as $module) {
            $role->permissions()->attach(Permission::create(['name' => 'account.'.$module.'.view']));
        }
        RoleAssignment::create(['user_id' => $admin->id, 'role_id' => $role->id]);
        for ($index = 0; $index < 21; $index++) {
            Role::create(['name' => 'Matching role '.$index, 'rank' => 10]);
            Permission::create(['name' => 'account.matching.view'.$index, 'module' => 'dynamic']);
        }
        $this->actingAs($admin);
        foreach ([
            ['/dashboard/users', 'users', ['search' => 'Matching', 'status' => 'active', 'verified' => 'yes']],
            ['/dashboard/roles', 'roles', ['search' => 'Matching']],
            ['/dashboard/permissions', 'permissions', ['search' => 'matching', 'module' => 'dynamic']],
        ] as [$path, $prop, $filters]) {
            $query = array_merge($filters, ['per_page' => 10, 'page' => 2, 'view' => 'grid']);
            $this->get($path.'?'.http_build_query($query))->assertOk()->assertInertia(fn ($page) => $page
                ->has($prop.'.data', 10)
                ->where($prop.'.total', 21)
                ->where($prop.'.current_page', 2)
                ->where($prop.'.per_page', 10)
                ->where($prop.'.next_page_url', function ($url) use ($filters) {
                    parse_str(parse_url($url, PHP_URL_QUERY), $query);

                    return $query['page'] === '3' && $query['per_page'] === '10' && $query['view'] === 'grid'
                        && array_intersect_assoc($filters, $query) === $filters;
                }));
        }
    }

    public function test_email_pagination_is_owner_scoped_and_filtered(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $other = User::factory()->create();
        for ($index = 0; $index < 21; $index++) {
            $user->emails()->create(['email' => 'matching'.$index.'@example.test', 'verified_at' => now()]);
        }
        $other->emails()->create(['email' => 'matching-other@example.test', 'verified_at' => now()]);
        $user->emails()->create(['email' => 'matching-unverified@example.test']);
        $this->actingAs($user)->get('/profile/emails?search=matching&verified=yes&per_page=10&page=2&view=grid')
            ->assertOk()->assertInertia(fn ($page) => $page->has('emails.data', 10)->where('emails.total', 21)->where('emails.current_page', 2));
    }

    public function test_invalid_pagination_and_filters_are_rejected(): void
    {
        $this->actingAs(User::factory()->create(['status' => 'active', 'is_primary_super_admin' => true]));
        foreach (['/dashboard/users', '/dashboard/roles', '/dashboard/permissions'] as $path) {
            foreach ([0, 15, 101, -10, 'invalid'] as $size) {
                $this->getJson($path.'?per_page='.$size)->assertUnprocessable()->assertJsonValidationErrors('per_page');
            }
            $this->getJson($path.'?page=0&view=invalid&search[]=x')->assertUnprocessable()->assertJsonValidationErrors(['page', 'view', 'search']);
        }
    }

    public function test_collection_views_do_not_bypass_authorization(): void
    {
        $this->actingAs(User::factory()->create(['status' => 'active']));
        foreach (['grid', 'list'] as $view) {
            foreach (['users', 'roles', 'permissions'] as $collection) {
                $this->get('/dashboard/'.$collection.'?view='.$view.'&per_page=10')->assertForbidden();
            }
        }
    }
}
