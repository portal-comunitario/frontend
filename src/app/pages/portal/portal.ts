import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

import { AuthService } from '../../auth/auth.service';
import { CommunityService } from '../../community/community.service';
import { CommunityEvent, EventRequest, Post, PostRequest } from '../../community/community.models';
import { environment } from '../../../environments/environment';

type Tab = 'noticias' | 'mapa' | 'eventos' | 'admin';
type TipoFiltro = 'TODOS' | 'ANUNCIO' | 'NOTICIA' | 'EVENTO' | 'SERVICIO' | 'COMPRA_VENTA' | 'ARRIENDO' | 'PERDIDO_ENCONTRADO';

const TIPO_COLORS: Record<string, string> = {
  ANUNCIO: '#f59e0b', NOTICIA: '#3b82f6', EVENTO: '#10b981',
  SERVICIO: '#8b5cf6', COMPRA_VENTA: '#f97316', ARRIENDO: '#06b6d4', PERDIDO_ENCONTRADO: '#ec4899',
};
const TIPO_LABELS: Record<string, string> = {
  ANUNCIO: 'Anuncio', NOTICIA: 'Noticia', EVENTO: 'Evento',
  SERVICIO: 'Servicio', COMPRA_VENTA: 'Compra y Venta', ARRIENDO: 'Arriendo', PERDIDO_ENCONTRADO: 'Perdido/Encontrado',
};

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
<div class="site-wrapper">

  <!-- ══ HEADER ══════════════════════════════════════════ -->
  <header class="site-header">
    <div class="site-header-inner">
      <div class="site-logo">
        <span class="logo-icon">🏘️</span>
        <div>
          <div class="logo-title">{{ communityName }}</div>
          <div class="logo-sub">Portal Comunitario</div>
        </div>
      </div>
      @if (auth.user(); as user) {
        <div class="header-user">
          @if (user.picture) { <img [src]="user.picture" class="user-avatar" /> }
          <span class="user-name-header">{{ user.name }}</span>
          <button class="btn-logout" (click)="auth.logout()">Salir</button>
        </div>
      }
    </div>
  </header>

  <!-- ══ NAV ═════════════════════════════════════════════ -->
  <nav class="site-nav">
    <div class="site-nav-inner">
      <button class="nav-tab" [class.active]="activeTab()==='noticias'" (click)="setTab('noticias')">INICIO</button>
      <button class="nav-tab" [class.active]="activeTab()==='mapa'" (click)="setTab('mapa')">MAPA COMUNITARIO</button>
      <button class="nav-tab" [class.active]="activeTab()==='eventos'" (click)="setTab('eventos')">EVENTOS</button>
      @if (isAdmin()) {
        <button class="nav-tab" [class.active]="activeTab()==='admin'" (click)="setTab('admin')">ADMINISTRACIÓN</button>
      }
    </div>
  </nav>

  <!-- ══ CONTENT ══════════════════════════════════════════ -->
  <main class="site-main">

    <!-- ── NOTICIAS ───────────────────────────────────── -->
    @if (activeTab() === 'noticias') {
      <!-- Hero -->
      <section class="hero">
        <div class="hero-inner">
          <h1>Tablero de Noticias</h1>
          <p>Mantente informado con los últimos anuncios, noticias y novedades de la comunidad.</p>
          <button class="btn-hero" (click)="togglePostForm()">
            {{ showPostForm() ? '✕ Cancelar' : '+ Nueva publicación' }}
          </button>
        </div>
      </section>

      <div class="content-area">
        <!-- Formulario -->
        @if (showPostForm()) {
          <div class="form-panel">
            <h3>Nueva publicación</h3>
            <form (ngSubmit)="submitPost()" #pf="ngForm">
              <div class="form-row">
                <div class="field">
                  <label>Título *</label>
                  <input name="titulo" [(ngModel)]="postForm.titulo" required placeholder="Ej: Luis Segovia — Gasfiter" />
                </div>
                <div class="field field-sm">
                  <label>Tipo</label>
                  <select name="tipo" [(ngModel)]="postForm.tipo">
                    <option value="ANUNCIO">Anuncio</option>
                    <option value="NOTICIA">Noticia</option>
                    <option value="EVENTO">Evento</option>
                    <option value="SERVICIO">Servicio vecinal</option>
                    <option value="COMPRA_VENTA">Compra y Venta</option>
                    <option value="ARRIENDO">Arriendo</option>
                    <option value="PERDIDO_ENCONTRADO">Perdido / Encontrado</option>
                  </select>
                </div>
              </div>
              <div class="field">
                <label>Contenido *</label>
                <textarea name="contenido" [(ngModel)]="postForm.contenido" required rows="3"
                          placeholder="Ej: Gasfitería en general. Teléfono: 09 1234 5678"></textarea>
              </div>
              <div class="field">
                <label>Ubicación en el mapa <span class="opt">(opcional — aparecerá como pin)</span></label>
                <div class="location-row">
                  <input name="busqueda" [(ngModel)]="busquedaDireccion"
                         placeholder="Ej: Calle las Brisas 3651" (keyup.enter)="geocodificar()" />
                  <button type="button" class="btn-secondary" (click)="geocodificar()" [disabled]="geocodificando()">
                    {{ geocodificando() ? '…' : '🔍 Buscar' }}
                  </button>
                  <button type="button" class="btn-secondary" (click)="usarMiUbicacion()">📍 GPS</button>
                </div>
                @if (geocodificandoError()) { <p class="msg-error">Dirección no encontrada. Agrega más detalles.</p> }
                @if (postForm.latitud) { <p class="msg-ok">✔ Ubicación definida — puedes ajustar el pin arrastrándolo</p> }
              </div>
              <div #miniMapContainer class="mini-map" [class.visible]="!!postForm.latitud"></div>
              @if (postError()) { <p class="msg-error">{{ postError() }}</p> }
              <div class="form-actions">
                <button type="button" class="btn-ghost" (click)="showPostForm.set(false)">Cancelar</button>
                <button type="submit" class="btn-primary" [disabled]="postSaving() || !pf.valid">
                  {{ postSaving() ? 'Publicando…' : 'Publicar' }}
                </button>
              </div>
            </form>
          </div>
        }

        <!-- Filtros -->
        <div class="filter-row">
          @for (f of tipoFiltros; track f.value) {
            <button class="filter-pill" [class.active]="filtroActivo()===f.value" (click)="filtroActivo.set(f.value)">
              {{ f.label }}
            </button>
          }
        </div>

        <!-- Grid de cards -->
        @if (postsLoading()) {
          <p class="msg-muted">Cargando publicaciones…</p>
        } @else if (postsFiltrados().length === 0) {
          <p class="msg-muted">No hay publicaciones para esta categoría.</p>
        } @else {
          <div class="cards-grid">
            @for (post of postsFiltrados(); track post.id) {
              <article class="news-card">
                <div class="news-card-band" [style.background]="TIPO_COLORS[post.tipo] ?? '#6366f1'">
                  <span class="news-card-tipo">{{ TIPO_LABELS[post.tipo] ?? post.tipo }}</span>
                  @if (post.estado === 'PENDIENTE') {
                    <span class="badge-pendiente">En revisión</span>
                  }
                  @if (post.estado === 'RECHAZADO') {
                    <span class="badge-rechazado">Rechazado</span>
                  }
                </div>
                <div class="news-card-body">
                  <h3>{{ post.titulo }}</h3>
                  <p>{{ post.contenido }}</p>
                  @if (post.direccion) { <p class="card-dir">📍 {{ post.direccion }}</p> }
                </div>
                <div class="news-card-footer">
                  <span class="card-meta">{{ post.createdAt | date:'dd/MM/yyyy' }}</span>
                  <div class="card-actions">
                    @if (post.latitud && post.estado === 'APROBADO') {
                      <button class="btn-map-link" (click)="irAlMapa(post)">Ver en mapa</button>
                    }
                    <button class="btn-delete" (click)="deletePost(post.id)">✕</button>
                  </div>
                </div>
              </article>
            }
          </div>
        }
      </div>
    }

    <!-- ── MAPA ───────────────────────────────────────── -->
    @if (activeTab() === 'mapa') {
      <section class="hero hero-mapa">
        <div class="hero-inner">
          <h1>Mapa Comunitario</h1>
          <p>Servicios, compra-venta, arriendos y publicaciones geolocalizadas de la comunidad.</p>
        </div>
      </section>
      <div class="mapa-layout">
        <div class="mapa-left">
          <div #mapContainer class="map-full"></div>
        </div>
        <aside class="mapa-sidebar">
          <div class="sidebar-head">
            <strong>Publicaciones</strong>
            <span class="count-badge">{{ postsConUbicacion().length }}</span>
          </div>
          <div class="sidebar-filters">
            @for (f of mapaFiltros; track f.value) {
              <button class="map-pill" [class.active]="mapaFiltro()===f.value"
                      [style.--c]="f.color" (click)="setMapaFiltro(f.value)">{{ f.label }}</button>
            }
          </div>
          <div class="sidebar-list">
            @if (postsFiltradosMapa().length === 0) {
              <p class="msg-muted" style="padding:1rem;font-size:.82rem">Sin publicaciones en esta categoría.</p>
            }
            @for (post of postsFiltradosMapa(); track post.id) {
              <div class="list-item" [class.active]="selectedPostId()===post.id" (click)="seleccionarPost(post)">
                <div class="list-item-top">
                  <span class="tipo-dot" [style.background]="TIPO_COLORS[post.tipo]??'#9ca3af'"></span>
                  <span class="list-item-tipo">{{ TIPO_LABELS[post.tipo] ?? post.tipo }}</span>
                </div>
                <div class="list-item-title">{{ post.titulo }}</div>
                @if (post.direccion) { <div class="list-item-dir">📍 {{ post.direccion }}</div> }
                @if (selectedPostId()===post.id) {
                  <div class="list-item-detail">
                    <p>{{ post.contenido }}</p>
                    <span class="msg-muted" style="font-size:.72rem">{{ post.authorEmail }}</span>
                  </div>
                }
              </div>
            }
          </div>
          <div class="sidebar-legend">
            @for (e of legendItems; track e.tipo) {
              <span class="leg"><span class="tipo-dot" [style.background]="e.color"></span>{{ e.label }}</span>
            }
          </div>
        </aside>
      </div>
    }

    <!-- ── EVENTOS ─────────────────────────────────────── -->
    @if (activeTab() === 'eventos') {
      <section class="hero hero-eventos">
        <div class="hero-inner">
          <h1>Eventos Comunitarios</h1>
          <p>Talleres, reuniones y actividades de la comunidad Villa Las Flores.</p>
          <button class="btn-hero" (click)="showEventForm.set(!showEventForm())">
            {{ showEventForm() ? '✕ Cancelar' : '+ Nuevo evento' }}
          </button>
        </div>
      </section>
      <div class="content-area">
        @if (showEventForm()) {
          <div class="form-panel">
            <h3>Nuevo evento</h3>
            <form (ngSubmit)="submitEvent()" #ef="ngForm">
              <div class="field">
                <label>Título *</label>
                <input name="titulo" [(ngModel)]="eventForm.titulo" required placeholder="Ej: Feria del barrio" />
              </div>
              <div class="field">
                <label>Descripción</label>
                <textarea name="descripcion" [(ngModel)]="eventForm.descripcion" rows="2"></textarea>
              </div>
              <div class="form-row">
                <div class="field">
                  <label>Fecha inicio *</label>
                  <input name="fi" type="datetime-local" [(ngModel)]="fechaInicioStr" required />
                </div>
                <div class="field">
                  <label>Fecha fin</label>
                  <input name="ff" type="datetime-local" [(ngModel)]="fechaFinStr" />
                </div>
              </div>
              <div class="field">
                <label>Ubicación</label>
                <input name="ubicacion" [(ngModel)]="eventForm.ubicacion" placeholder="Ej: Plaza central" />
              </div>
              @if (eventError()) { <p class="msg-error">{{ eventError() }}</p> }
              <div class="form-actions">
                <button type="button" class="btn-ghost" (click)="showEventForm.set(false)">Cancelar</button>
                <button type="submit" class="btn-primary" [disabled]="eventSaving() || !ef.valid">
                  {{ eventSaving() ? 'Guardando…' : 'Crear evento' }}
                </button>
              </div>
            </form>
          </div>
        }
        @if (eventsLoading()) { <p class="msg-muted">Cargando eventos…</p> }
        @else if (events().length === 0) { <p class="msg-muted">No hay eventos programados aún.</p> }
        @else {
          <div class="cards-grid">
            @for (ev of events(); track ev.id) {
              <article class="news-card">
                <div class="news-card-band" style="background:#10b981">
                  <span class="news-card-tipo">EVENTO</span>
                </div>
                <div class="news-card-body">
                  <h3>{{ ev.titulo }}</h3>
                  @if (ev.descripcion) { <p>{{ ev.descripcion }}</p> }
                  <div class="event-meta">
                    <span>📅 {{ ev.fechaInicio | date:'dd/MM/yyyy HH:mm' }}</span>
                    @if (ev.fechaFin) { <span>→ {{ ev.fechaFin | date:'HH:mm' }}</span> }
                    @if (ev.ubicacion) { <span>📍 {{ ev.ubicacion }}</span> }
                  </div>
                </div>
                <div class="news-card-footer">
                  <span class="card-meta">{{ ev.authorEmail }}</span>
                  <button class="btn-delete" (click)="deleteEvent(ev.id)">✕</button>
                </div>
              </article>
            }
          </div>
        }
      </div>
    }

    <!-- ── ADMIN ──────────────────────────────────────── -->
    @if (activeTab() === 'admin') {
      <section class="hero hero-admin">
        <div class="hero-inner">
          <h1>Administración</h1>
          <p>Panel de moderación y gestión de la comunidad {{ communityName }}.</p>
        </div>
      </section>
      <div class="content-area">

        <!-- Cola de moderación -->
        <div class="admin-section">
          <div class="admin-section-head">
            <h2>Cola de moderación</h2>
            <span class="count-badge">{{ postsPendientes().length }} pendiente{{ postsPendientes().length === 1 ? '' : 's' }}</span>
          </div>
          @if (postsPendientesLoading()) {
            <p class="msg-muted">Cargando publicaciones pendientes…</p>
          } @else if (postsPendientes().length === 0) {
            <div class="empty-state">
              <span>✅</span>
              <p>No hay publicaciones pendientes de revisión.</p>
            </div>
          } @else {
            <div class="moderation-list">
              @for (post of postsPendientes(); track post.id) {
                <div class="mod-item">
                  <div class="mod-item-left">
                    <span class="tipo-dot" [style.background]="TIPO_COLORS[post.tipo] ?? '#9ca3af'"></span>
                    <div>
                      <div class="mod-title">{{ post.titulo }}</div>
                      <div class="mod-meta">{{ TIPO_LABELS[post.tipo] ?? post.tipo }} · {{ post.authorEmail }} · {{ post.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
                      <div class="mod-contenido">{{ post.contenido }}</div>
                      @if (post.direccion) { <div class="mod-dir">📍 {{ post.direccion }}</div> }
                    </div>
                  </div>
                  <div class="mod-actions">
                    <button class="btn-aprobar" (click)="aprobarPost(post.id)">✔ Aprobar</button>
                    <button class="btn-rechazar" (click)="rechazarPost(post.id)">✕ Rechazar</button>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Módulos futuros -->
        <div class="admin-section">
          <div class="admin-section-head"><h2>Otros módulos</h2></div>
          <div class="admin-grid">
            @for (item of adminItems; track item.title) {
              <div class="admin-card">
                <div class="admin-icon">{{ item.icon }}</div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.desc }}</p>
                <span class="coming-soon">Próximamente</span>
              </div>
            }
          </div>
        </div>

      </div>
    }

  </main>

  <!-- ══ FOOTER ═══════════════════════════════════════════ -->
  <footer class="site-footer">
    <div class="site-footer-inner">
      <span>© 2026 Portal Comunitario Villa Las Flores</span>
      <span>Taller Aplicado de Software · Duoc UC</span>
    </div>
  </footer>

</div>
  `,
  styles: [`
    /* ─── Reset / base ─────────────────────────────────── */
    * { box-sizing: border-box; }
    :host { display: block; font-family: 'Segoe UI', system-ui, sans-serif; }

    /* ─── Site wrapper ──────────────────────────────────── */
    .site-wrapper { min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f9; }

    /* ─── Header ────────────────────────────────────────── */
    .site-header { background: #fff; border-bottom: 1px solid #dde3ec; padding: 0 2rem; }
    .site-header-inner { max-width: 1200px; margin: 0 auto; height: 70px; display: flex; align-items: center; justify-content: space-between; }
    .site-logo { display: flex; align-items: center; gap: 0.75rem; }
    .logo-icon { font-size: 2.2rem; }
    .logo-title { font-size: 1.1rem; font-weight: 800; color: #003087; line-height: 1.2; }
    .logo-sub { font-size: 0.7rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; }
    .header-user { display: flex; align-items: center; gap: 0.6rem; }
    .user-avatar { width: 34px; height: 34px; border-radius: 50%; border: 2px solid #e5e7eb; }
    .user-name-header { font-size: 0.85rem; color: #374151; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .btn-logout { border: 1px solid #d1d5db; background: #fff; border-radius: 4px; padding: 5px 12px; font-size: 0.8rem; cursor: pointer; color: #6b7280; }
    .btn-logout:hover { background: #f9fafb; }

    /* ─── Navigation ────────────────────────────────────── */
    .site-nav { background: #003087; }
    .site-nav-inner { max-width: 1200px; margin: 0 auto; display: flex; }
    .nav-tab { background: none; border: none; color: rgba(255,255,255,0.8); padding: 0 1.4rem; height: 46px; cursor: pointer; font-size: 0.82rem; font-weight: 600; letter-spacing: 0.06em; border-bottom: 3px solid transparent; transition: all 0.15s; }
    .nav-tab:hover { color: #fff; background: rgba(255,255,255,0.08); }
    .nav-tab.active { color: #fff; border-bottom-color: #f5c518; }

    /* ─── Hero ──────────────────────────────────────────── */
    .hero { background: linear-gradient(135deg, #003087 0%, #0055b3 60%, #0077cc 100%); color: #fff; padding: 3rem 2rem; }
    .hero-mapa { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%); }
    .hero-eventos { background: linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%); }
    .hero-admin { background: linear-gradient(135deg, #1f2937 0%, #374151 60%, #4b5563 100%); }
    .hero-inner { max-width: 1200px; margin: 0 auto; }
    .hero-inner h1 { margin: 0 0 0.5rem; font-size: 2rem; font-weight: 800; }
    .hero-inner p { margin: 0 0 1.25rem; opacity: 0.85; font-size: 0.95rem; max-width: 600px; }
    .btn-hero { background: #f5c518; color: #1a1a1a; border: none; border-radius: 4px; padding: 10px 22px; font-size: 0.9rem; font-weight: 700; cursor: pointer; }
    .btn-hero:hover { background: #e6b800; }

    /* ─── Content area ──────────────────────────────────── */
    .content-area { max-width: 1200px; margin: 0 auto; padding: 2rem; flex: 1; }

    /* ─── Form panel ────────────────────────────────────── */
    .form-panel { background: #fff; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .form-panel h3 { margin: 0 0 1.25rem; font-size: 1rem; color: #003087; border-bottom: 2px solid #003087; padding-bottom: 0.5rem; }
    .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 0.85rem; flex: 1; }
    .field-sm { max-width: 200px; }
    .form-row { display: flex; gap: 1rem; }
    label { font-size: 0.78rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.04em; }
    .opt { font-weight: 400; text-transform: none; color: #9ca3af; }
    input, select, textarea { border: 1px solid #d1d5db; border-radius: 4px; padding: 8px 10px; font-size: 0.9rem; width: 100%; }
    input:focus, select:focus, textarea:focus { outline: 2px solid #003087; border-color: transparent; }
    textarea { resize: vertical; }
    .location-row { display: flex; gap: 0.5rem; }
    .location-row input { flex: 1; }
    .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1rem; }
    .mini-map { height: 0; overflow: hidden; border-radius: 6px; border: 1px solid #e5e7eb; transition: height 0.2s; margin-bottom: 0.75rem; }
    .mini-map.visible { height: 200px; }

    /* ─── Buttons ───────────────────────────────────────── */
    .btn-primary { background: #003087; color: #fff; border: none; border-radius: 4px; padding: 9px 22px; cursor: pointer; font-size: 0.88rem; font-weight: 600; }
    .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-secondary { border: 1px solid #d1d5db; background: #fff; border-radius: 4px; padding: 7px 12px; cursor: pointer; font-size: 0.82rem; white-space: nowrap; }
    .btn-ghost { border: 1px solid #d1d5db; background: transparent; border-radius: 4px; padding: 8px 16px; cursor: pointer; font-size: 0.85rem; }

    /* ─── Filter pills ──────────────────────────────────── */
    .filter-row { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
    .filter-pill { border: 1px solid #d1d5db; background: #fff; border-radius: 999px; padding: 6px 16px; cursor: pointer; font-size: 0.8rem; font-weight: 500; }
    .filter-pill.active { background: #003087; color: #fff; border-color: #003087; }

    /* ─── News cards ─────────────────────────────────────── */
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
    .news-card { background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.07); display: flex; flex-direction: column; transition: box-shadow 0.15s, transform 0.15s; }
    .news-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); transform: translateY(-2px); }
    .news-card-band { padding: 0.75rem 1rem; display: flex; align-items: center; min-height: 70px; }
    .news-card-tipo { font-size: 0.72rem; font-weight: 800; color: #fff; letter-spacing: 0.1em; text-transform: uppercase; background: rgba(0,0,0,0.2); padding: 3px 8px; border-radius: 3px; }
    .news-card-body { padding: 1rem; flex: 1; }
    .news-card-body h3 { margin: 0 0 0.5rem; font-size: 0.97rem; color: #1f2937; line-height: 1.4; }
    .news-card-body p { margin: 0 0 0.4rem; color: #6b7280; font-size: 0.85rem; line-height: 1.5; }
    .card-dir { color: #9ca3af !important; font-size: 0.78rem !important; }
    .news-card-footer { padding: 0.6rem 1rem; border-top: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; }
    .card-meta { font-size: 0.75rem; color: #9ca3af; }
    .card-actions { display: flex; gap: 0.5rem; align-items: center; }
    .btn-map-link { background: #eef2ff; color: #3730a3; border: none; border-radius: 3px; padding: 3px 8px; font-size: 0.75rem; cursor: pointer; }
    .btn-map-link:hover { background: #e0e7ff; }
    .btn-delete { background: none; border: none; color: #d1d5db; cursor: pointer; font-size: 0.9rem; padding: 2px 5px; border-radius: 3px; }
    .btn-delete:hover { color: #ef4444; background: #fef2f2; }
    .event-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; font-size: 0.78rem; color: #6b7280; margin-top: 0.5rem; }

    /* ─── Mapa layout ────────────────────────────────────── */
    .mapa-layout { display: flex; height: calc(100vh - 70px - 46px - 120px); min-height: 500px; }
    .mapa-left { flex: 1; min-width: 0; }
    .map-full { height: 100%; }

    /* Mapa sidebar */
    .mapa-sidebar { width: 310px; min-width: 310px; background: #fff; border-left: 1px solid #e5e7eb; display: flex; flex-direction: column; }
    .sidebar-head { padding: 0.85rem 1rem; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; justify-content: space-between; }
    .sidebar-head strong { font-size: 0.9rem; color: #1f2937; }
    .count-badge { background: #003087; color: #fff; border-radius: 999px; font-size: 0.72rem; padding: 2px 8px; font-weight: 700; }
    .sidebar-filters { padding: 0.65rem 0.75rem; display: flex; flex-wrap: wrap; gap: 0.35rem; border-bottom: 1px solid #f3f4f6; }
    .map-pill { border: 1px solid #e5e7eb; background: #f9fafb; border-radius: 999px; padding: 3px 10px; cursor: pointer; font-size: 0.73rem; font-weight: 500; }
    .map-pill.active { background: var(--c, #003087); color: #fff; border-color: transparent; }
    .sidebar-list { flex: 1; overflow-y: auto; }
    .list-item { padding: 0.7rem 1rem; cursor: pointer; border-bottom: 1px solid #f9fafb; transition: background 0.1s; }
    .list-item:hover { background: #f8fafc; }
    .list-item.active { background: #eff6ff; border-left: 3px solid #003087; }
    .list-item-top { display: flex; align-items: center; gap: 5px; margin-bottom: 2px; }
    .tipo-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
    .list-item-tipo { font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
    .list-item-title { font-size: 0.86rem; font-weight: 600; color: #1f2937; }
    .list-item-dir { font-size: 0.74rem; color: #9ca3af; }
    .list-item-detail { margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #f3f4f6; font-size: 0.8rem; color: #4b5563; }
    .list-item-detail p { margin: 0 0 4px; }
    .sidebar-legend { padding: 0.65rem 0.75rem; border-top: 1px solid #f3f4f6; display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .leg { display: flex; align-items: center; gap: 4px; font-size: 0.7rem; color: #6b7280; }

    /* ─── Admin ─────────────────────────────────────────── */
    .admin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem; }
    .admin-card { background: #fff; border-radius: 8px; padding: 1.5rem; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
    .admin-icon { font-size: 2.8rem; margin-bottom: 0.75rem; }
    .admin-card h3 { margin: 0 0 0.4rem; font-size: 0.95rem; color: #1f2937; }
    .admin-card p { margin: 0 0 0.85rem; color: #6b7280; font-size: 0.82rem; }
    .coming-soon { background: #f3f4f6; color: #9ca3af; font-size: 0.72rem; padding: 3px 10px; border-radius: 999px; }

    /* ─── Footer ────────────────────────────────────────── */
    .site-footer { background: #003087; color: rgba(255,255,255,0.7); padding: 1rem 2rem; margin-top: auto; }
    .site-footer-inner { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; font-size: 0.78rem; }

    /* ─── Estado badges en cards ────────────────────────── */
    .badge-pendiente { font-size: 0.68rem; font-weight: 700; background: rgba(0,0,0,0.25); color: #fef9c3; padding: 2px 7px; border-radius: 3px; margin-left: auto; }
    .badge-rechazado { font-size: 0.68rem; font-weight: 700; background: rgba(220,38,38,0.35); color: #fff; padding: 2px 7px; border-radius: 3px; margin-left: auto; }

    /* ─── Admin sections ────────────────────────────────── */
    .admin-section { margin-bottom: 2.5rem; }
    .admin-section-head { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
    .admin-section-head h2 { margin: 0; font-size: 1rem; color: #1f2937; }

    /* ─── Moderation list ───────────────────────────────── */
    .moderation-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .mod-item { background: #fff; border-radius: 8px; padding: 1rem 1.25rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
    .mod-item-left { display: flex; gap: 0.75rem; flex: 1; min-width: 0; }
    .mod-title { font-weight: 700; font-size: 0.92rem; color: #1f2937; margin-bottom: 2px; }
    .mod-meta { font-size: 0.74rem; color: #9ca3af; margin-bottom: 4px; }
    .mod-contenido { font-size: 0.84rem; color: #4b5563; }
    .mod-dir { font-size: 0.76rem; color: #9ca3af; margin-top: 3px; }
    .mod-actions { display: flex; flex-direction: column; gap: 0.4rem; flex-shrink: 0; }
    .btn-aprobar { background: #059669; color: #fff; border: none; border-radius: 4px; padding: 6px 14px; cursor: pointer; font-size: 0.82rem; font-weight: 600; white-space: nowrap; }
    .btn-aprobar:hover { background: #047857; }
    .btn-rechazar { background: #fff; color: #dc2626; border: 1px solid #fca5a5; border-radius: 4px; padding: 6px 14px; cursor: pointer; font-size: 0.82rem; font-weight: 600; white-space: nowrap; }
    .btn-rechazar:hover { background: #fef2f2; }
    .empty-state { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 2rem; text-align: center; color: #059669; }
    .empty-state span { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
    .empty-state p { margin: 0; font-size: 0.9rem; }

    /* ─── Misc ──────────────────────────────────────────── */
    .msg-muted { color: #9ca3af; font-size: 0.88rem; }
    .msg-ok { color: #059669; font-size: 0.78rem; margin: 4px 0 0; }
    .msg-error { color: #dc2626; font-size: 0.78rem; margin: 4px 0 0; }
  `]
})
export class Portal implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('miniMapContainer') miniMapContainer!: ElementRef<HTMLDivElement>;

  protected readonly auth = inject(AuthService);
  private readonly svc = inject(CommunityService);
  protected readonly TIPO_COLORS = TIPO_COLORS;
  protected readonly TIPO_LABELS = TIPO_LABELS;
  protected readonly communityName = environment.communityName;
  protected readonly isAdmin = () => {
    const r = this.auth.role();
    return r === 'COMMUNITY_ADMIN' || r === 'PLATFORM_ADMIN';
  };

  postsPendientes = signal<Post[]>([]);
  postsPendientesLoading = signal(false);

  activeTab = signal<Tab>('noticias');
  showPostForm = signal(false);
  showEventForm = signal(false);

  posts = signal<Post[]>([]);
  postsLoading = signal(true);
  postSaving = signal(false);
  postError = signal<string | null>(null);
  filtroActivo = signal<TipoFiltro>('TODOS');
  postForm: PostRequest = { titulo: '', contenido: '', tipo: 'ANUNCIO', latitud: null, longitud: null, direccion: null };

  busquedaDireccion = '';
  geocodificando = signal(false);
  geocodificandoError = signal(false);
  private miniMap: L.Map | null = null;
  private miniMarker: L.Marker | null = null;
  private miniMapReady = false;

  events = signal<CommunityEvent[]>([]);
  eventsLoading = signal(true);
  eventSaving = signal(false);
  eventError = signal<string | null>(null);
  eventForm: EventRequest = { titulo: '', descripcion: '', fechaInicio: '', fechaFin: null, ubicacion: null };
  fechaInicioStr = '';
  fechaFinStr = '';

  mapaFiltro = signal<TipoFiltro>('TODOS');
  selectedPostId = signal<string | null>(null);
  private map: L.Map | null = null;
  private mapReady = false;
  private markers: L.CircleMarker[] = [];
  private markerMap = new Map<string, L.CircleMarker>();

  tipoFiltros = [
    { value: 'TODOS' as TipoFiltro, label: 'Todos' },
    { value: 'ANUNCIO' as TipoFiltro, label: 'Anuncios' },
    { value: 'NOTICIA' as TipoFiltro, label: 'Noticias' },
    { value: 'EVENTO' as TipoFiltro, label: 'Eventos' },
    { value: 'SERVICIO' as TipoFiltro, label: 'Servicios' },
    { value: 'COMPRA_VENTA' as TipoFiltro, label: 'Compra y Venta' },
    { value: 'ARRIENDO' as TipoFiltro, label: 'Arriendos' },
    { value: 'PERDIDO_ENCONTRADO' as TipoFiltro, label: 'Perdidos' },
  ];

  mapaFiltros = [
    { value: 'TODOS' as TipoFiltro, label: 'Todos', color: '#003087' },
    { value: 'SERVICIO' as TipoFiltro, label: 'Servicios', color: '#8b5cf6' },
    { value: 'COMPRA_VENTA' as TipoFiltro, label: 'Compra/Venta', color: '#f97316' },
    { value: 'ARRIENDO' as TipoFiltro, label: 'Arriendos', color: '#06b6d4' },
    { value: 'PERDIDO_ENCONTRADO' as TipoFiltro, label: 'Perdidos', color: '#ec4899' },
    { value: 'ANUNCIO' as TipoFiltro, label: 'Anuncios', color: '#f59e0b' },
  ];

  legendItems = [
    { tipo: 'SERVICIO', label: 'Servicio', color: '#8b5cf6' },
    { tipo: 'COMPRA_VENTA', label: 'Compra/Venta', color: '#f97316' },
    { tipo: 'ARRIENDO', label: 'Arriendo', color: '#06b6d4' },
    { tipo: 'PERDIDO_ENCONTRADO', label: 'Perdido', color: '#ec4899' },
    { tipo: 'ANUNCIO', label: 'Anuncio', color: '#f59e0b' },
    { tipo: 'NOTICIA', label: 'Noticia', color: '#3b82f6' },
  ];

  adminItems = [
    { icon: '👥', title: 'Gestión de Vecinos', desc: 'Usuarios, roles y validación de residentes.' },
    { icon: '💰', title: 'Cuotas y Pagos', desc: 'Control de cuotas y pagos de talleres.' },
    { icon: '👩‍👧', title: 'Centro de Madres', desc: 'Actividades y asistencia.' },
    { icon: '🧓', title: 'Club Adulto Mayor', desc: 'Actividades y recordatorios.' },
    { icon: '📄', title: 'Certificados', desc: 'Emisión de certificados de residencia en PDF.' },
  ];

  postsConUbicacion = () => this.posts().filter(p => p.latitud != null && p.longitud != null && p.estado === 'APROBADO');
  postsFiltrados = () => { const f = this.filtroActivo(); return f === 'TODOS' ? this.posts() : this.posts().filter(p => p.tipo === f); };
  postsFiltradosMapa = () => { const f = this.mapaFiltro(); return f === 'TODOS' ? this.postsConUbicacion() : this.postsConUbicacion().filter(p => p.tipo === f); };

  ngOnInit(): void { this.loadPosts(); this.loadEvents(); }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    if (tab !== 'mapa') this.mapReady = false;
    if (tab === 'admin' && this.isAdmin()) this.loadPostsPendientes();
  }

  ngAfterViewChecked(): void {
    if (this.activeTab() === 'mapa' && this.mapContainer && !this.mapReady) this.initMap();
    if (this.showPostForm() && this.miniMapContainer && !!this.postForm.latitud && !this.miniMapReady) this.initMiniMap();
  }

  ngOnDestroy(): void { this.map?.remove(); this.miniMap?.remove(); }


  togglePostForm(): void {
    this.showPostForm.update(v => !v);
    if (!this.showPostForm()) { this.miniMap?.remove(); this.miniMap = null; this.miniMarker = null; this.miniMapReady = false; }
  }

  // ── Posts ──────────────────────────────────────────────
  private loadPosts(): void {
    this.postsLoading.set(true);
    this.svc.getPosts().subscribe({ next: d => { this.posts.set(d); this.postsLoading.set(false); this.refreshMapMarkers(); }, error: () => this.postsLoading.set(false) });
  }

  submitPost(): void {
    this.postSaving.set(true); this.postError.set(null);
    this.svc.createPost(this.postForm).subscribe({
      next: p => { this.posts.update(prev => [p, ...prev]); this.postForm = { titulo: '', contenido: '', tipo: 'ANUNCIO', latitud: null, longitud: null, direccion: null }; this.busquedaDireccion = ''; this.miniMap?.remove(); this.miniMap = null; this.miniMarker = null; this.miniMapReady = false; this.showPostForm.set(false); this.postSaving.set(false); this.refreshMapMarkers(); },
      error: () => { this.postError.set('Error al publicar. Intenta nuevamente.'); this.postSaving.set(false); }
    });
  }

  deletePost(id: string): void { this.svc.deletePost(id).subscribe({ next: () => { this.posts.update(p => p.filter(x => x.id !== id)); this.refreshMapMarkers(); } }); }

  private loadPostsPendientes(): void {
    this.postsPendientesLoading.set(true);
    this.svc.getPostsPendientes().subscribe({
      next: d => { this.postsPendientes.set(d); this.postsPendientesLoading.set(false); },
      error: () => this.postsPendientesLoading.set(false),
    });
  }

  aprobarPost(id: string): void {
    this.svc.aprobarPost(id).subscribe({
      next: updated => {
        this.postsPendientes.update(p => p.filter(x => x.id !== id));
        this.posts.update(p => p.map(x => x.id === id ? updated : x));
        this.refreshMapMarkers();
      }
    });
  }

  rechazarPost(id: string): void {
    this.svc.rechazarPost(id).subscribe({
      next: updated => {
        this.postsPendientes.update(p => p.filter(x => x.id !== id));
        this.posts.update(p => p.map(x => x.id === id ? updated : x));
      }
    });
  }

  irAlMapa(post: Post): void { this.setTab('mapa'); setTimeout(() => this.seleccionarPost(post), 400); }

  seleccionarPost(post: Post): void {
    this.selectedPostId.set(post.id);
    if (post.latitud && post.longitud && this.map) { this.map.setView([post.latitud, post.longitud], 17); this.markerMap.get(post.id)?.openPopup(); }
  }

  setMapaFiltro(f: TipoFiltro): void { this.mapaFiltro.set(f); this.selectedPostId.set(null); }

  // ── Geocodificación ─────────────────────────────────────
  async geocodificar(): Promise<void> {
    if (!this.busquedaDireccion.trim()) return;
    this.geocodificando.set(true); this.geocodificandoError.set(false);
    try {
      const q = encodeURIComponent(this.busquedaDireccion + ', Chile');
      const data = await (await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`)).json();
      if (data.length > 0) {
        this.postForm = { ...this.postForm, latitud: parseFloat(data[0].lat), longitud: parseFloat(data[0].lon), direccion: this.busquedaDireccion };
        this.miniMapReady = false;
        setTimeout(() => this.initMiniMap(), 50);
      } else { this.geocodificandoError.set(true); }
    } catch { this.geocodificandoError.set(true); }
    finally { this.geocodificando.set(false); }
  }

  usarMiUbicacion(): void {
    navigator.geolocation?.getCurrentPosition(p => {
      this.postForm = { ...this.postForm, latitud: p.coords.latitude, longitud: p.coords.longitude, direccion: this.busquedaDireccion || 'Mi ubicación' };
      this.miniMapReady = false;
      setTimeout(() => this.initMiniMap(), 50);
    });
  }

  private initMiniMap(): void {
    if (!this.miniMapContainer?.nativeElement || !this.postForm.latitud || !this.postForm.longitud) return;
    this.miniMapReady = true;
    const lat = this.postForm.latitud, lng = this.postForm.longitud;
    if (this.miniMap) { this.miniMap.setView([lat, lng], 16); this.miniMarker?.setLatLng([lat, lng]); return; }
    this.miniMap = L.map(this.miniMapContainer.nativeElement).setView([lat, lng], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(this.miniMap);
    this.miniMarker = L.marker([lat, lng], { icon: markerIcon, draggable: true }).addTo(this.miniMap);
    this.miniMarker.on('dragend', (e: L.LeafletEvent) => { const p = (e.target as L.Marker).getLatLng(); this.postForm = { ...this.postForm, latitud: p.lat, longitud: p.lng }; });
    this.miniMap.on('click', (e: L.LeafletMouseEvent) => { this.miniMarker?.setLatLng(e.latlng); this.postForm = { ...this.postForm, latitud: e.latlng.lat, longitud: e.latlng.lng }; });
  }

  // ── Events ──────────────────────────────────────────────
  private loadEvents(): void {
    this.eventsLoading.set(true);
    this.svc.getEvents().subscribe({ next: d => { this.events.set(d); this.eventsLoading.set(false); }, error: () => this.eventsLoading.set(false) });
  }

  submitEvent(): void {
    this.eventSaving.set(true); this.eventError.set(null);
    this.svc.createEvent({ ...this.eventForm, fechaInicio: this.fechaInicioStr, fechaFin: this.fechaFinStr || null }).subscribe({
      next: ev => { this.events.update(p => [ev, ...p]); this.eventForm = { titulo: '', descripcion: '', fechaInicio: '', fechaFin: null, ubicacion: null }; this.fechaInicioStr = ''; this.fechaFinStr = ''; this.showEventForm.set(false); this.eventSaving.set(false); },
      error: () => { this.eventError.set('Error al crear el evento.'); this.eventSaving.set(false); }
    });
  }

  deleteEvent(id: string): void { this.svc.deleteEvent(id).subscribe({ next: () => this.events.update(p => p.filter(e => e.id !== id)) }); }

  // ── Mapa principal ──────────────────────────────────────
  private initMap(): void {
    if (!this.mapContainer?.nativeElement) return;
    this.mapReady = true;
    this.map = L.map(this.mapContainer.nativeElement).setView([-33.45, -70.65], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>', maxZoom: 19 }).addTo(this.map);
    this.refreshMapMarkers();
  }

  private refreshMapMarkers(): void {
    if (!this.map) return;
    this.markers.forEach(m => m.remove()); this.markers = []; this.markerMap.clear();
    this.postsConUbicacion().forEach(post => {
      const color = TIPO_COLORS[post.tipo] ?? '#6366f1';
      const marker = L.circleMarker([post.latitud!, post.longitud!], { radius: 11, fillColor: color, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.9 }).addTo(this.map!);
      marker.bindPopup(`<div style="min-width:200px;font-family:system-ui"><strong style="font-size:.9rem">${post.titulo}</strong><br><span style="font-size:.7rem;background:${color};color:#fff;padding:1px 7px;border-radius:999px;font-weight:700">${TIPO_LABELS[post.tipo]??post.tipo}</span>${post.direccion?`<br><span style="font-size:.78rem;color:#6b7280;display:block;margin-top:4px">📍 ${post.direccion}</span>`:''}<p style="margin:6px 0 2px;font-size:.82rem;color:#374151">${post.contenido}</p><span style="font-size:.72rem;color:#9ca3af">${post.authorEmail}</span></div>`);
      marker.on('click', () => this.selectedPostId.set(post.id));
      this.markers.push(marker); this.markerMap.set(post.id, marker);
    });
    if (this.markers.length > 0 && this.map) this.map.fitBounds(L.featureGroup(this.markers).getBounds().pad(0.3));
  }
}
