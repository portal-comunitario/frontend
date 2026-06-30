import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CommunityService } from '../../community/community.service';
import { Post, PostRequest } from '../../community/community.models';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  template: `
    <div class="container">
      <nav class="breadcrumb">
        <a routerLink="/dashboard">← Volver al inicio</a>
      </nav>

      <h1>Publicaciones</h1>

      <!-- Formulario nuevo post -->
      <section class="card form-card">
        <h2>Nueva publicación</h2>
        <form (ngSubmit)="submit()" #f="ngForm">
          <div class="field">
            <label for="titulo">Título *</label>
            <input id="titulo" name="titulo" [(ngModel)]="form.titulo"
                   required maxlength="255" placeholder="Ej: Reunión de vecinos" />
          </div>
          <div class="field">
            <label for="tipo">Tipo</label>
            <select id="tipo" name="tipo" [(ngModel)]="form.tipo">
              <option value="ANUNCIO">Anuncio</option>
              <option value="NOTICIA">Noticia</option>
              <option value="EVENTO">Evento</option>
            </select>
          </div>
          <div class="field">
            <label for="contenido">Contenido *</label>
            <textarea id="contenido" name="contenido" [(ngModel)]="form.contenido"
                      required rows="4" placeholder="Escribe el contenido..."></textarea>
          </div>
          @if (error()) {
            <p class="error">{{ error() }}</p>
          }
          <button type="submit" [disabled]="saving() || !f.valid" class="btn-primary">
            {{ saving() ? 'Publicando…' : 'Publicar' }}
          </button>
        </form>
      </section>

      <!-- Lista de posts -->
      <section class="posts-list">
        @if (loading()) {
          <p class="muted">Cargando publicaciones…</p>
        } @else if (posts().length === 0) {
          <p class="muted">No hay publicaciones aún. ¡Sé el primero en publicar!</p>
        } @else {
          @for (post of posts(); track post.id) {
            <article class="card post-card">
              <div class="post-header">
                <span class="badge badge-{{ post.tipo.toLowerCase() }}">{{ post.tipo }}</span>
                <span class="muted small">{{ post.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <h3>{{ post.titulo }}</h3>
              <p>{{ post.contenido }}</p>
              <footer class="post-footer">
                <span class="muted small">{{ post.authorEmail }}</span>
                <button class="btn-danger small" (click)="deletePost(post.id)">Eliminar</button>
              </footer>
            </article>
          }
        }
      </section>
    </div>
  `,
  styles: [`
    .container { max-width: 700px; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, sans-serif; }
    .breadcrumb { margin-bottom: 1rem; }
    .breadcrumb a { color: #6366f1; text-decoration: none; font-size: 0.9rem; }
    h1 { margin-bottom: 1.5rem; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.25rem; }
    .form-card { margin-bottom: 2rem; }
    h2 { margin-top: 0; font-size: 1.1rem; }
    .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 0.75rem; }
    label { font-size: 0.85rem; font-weight: 600; color: #374151; }
    input, select, textarea { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 10px; font-size: 0.95rem; width: 100%; box-sizing: border-box; }
    textarea { resize: vertical; }
    .btn-primary { background: #6366f1; color: #fff; border: none; border-radius: 6px; padding: 8px 20px; cursor: pointer; font-size: 0.95rem; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-danger { background: #ef4444; color: #fff; border: none; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 0.8rem; }
    .error { color: #dc2626; font-size: 0.85rem; margin-bottom: 0.5rem; }
    .post-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
    .post-card h3 { margin: 0 0 0.5rem; }
    .post-card p { margin: 0; color: #374151; }
    .post-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #f3f4f6; }
    .badge { font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
    .badge-anuncio { background: #fef3c7; color: #92400e; }
    .badge-noticia { background: #dbeafe; color: #1e40af; }
    .badge-evento { background: #d1fae5; color: #065f46; }
    .muted { color: #9ca3af; }
    .small { font-size: 0.8rem; }
  `]
})
export class Posts implements OnInit {
  private readonly svc = inject(CommunityService);

  posts = signal<Post[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  form: PostRequest = { titulo: '', contenido: '', tipo: 'ANUNCIO', latitud: null, longitud: null, direccion: null };

  ngOnInit(): void {
    this.loadPosts();
  }

  private loadPosts(): void {
    this.loading.set(true);
    this.svc.getPosts().subscribe({
      next: (data) => { this.posts.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  submit(): void {
    this.saving.set(true);
    this.error.set(null);
    this.svc.createPost(this.form).subscribe({
      next: (post) => {
        this.posts.update(prev => [post, ...prev]);
        this.form = { titulo: '', contenido: '', tipo: 'ANUNCIO', latitud: null, longitud: null, direccion: null };
        this.saving.set(false);
      },
      error: () => {
        this.error.set('Error al publicar. Intenta nuevamente.');
        this.saving.set(false);
      }
    });
  }

  deletePost(id: string): void {
    this.svc.deletePost(id).subscribe({
      next: () => this.posts.update(prev => prev.filter(p => p.id !== id)),
      error: () => {}
    });
  }
}
