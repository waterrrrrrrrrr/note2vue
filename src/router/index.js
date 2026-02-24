import { createRouter, createWebHistory } from 'vue-router';
import CategoriesView from '../views/CategoriesView.vue';
import CategoryNotesView from '../views/CategoryNotesView.vue';
import NoteView from '../views/NoteView.vue';
import NoteFormView from '../views/NoteFormView.vue';

const routes = [
  {
    path: '/',
    redirect: '/categories'
  },
  {
    path: '/categories',
    name: 'Categories',
    component: CategoriesView
  },
  {
    path: '/category/:id',
    name: 'CategoryNotes',
    component: CategoryNotesView,
    props: true
  },
  {
    path: '/note/new',
    name: 'NewNote',
    component: NoteFormView
  },
  {
    path: '/note/:id/edit',
    name: 'EditNote',
    component: NoteFormView,
    props: route => ({ noteId: route.params.id })
  },
  {
    path: '/note/:id',
    name: 'NoteDetail',
    component: NoteView,
    props: true
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
