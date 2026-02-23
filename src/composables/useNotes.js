import { ref } from 'vue';
import db from '../db/index';
import { ElMessage } from 'element-plus';

export function useNotes() {
  const notes = ref([]);
  const loading = ref(false);

  const loadNotesByCategory = async (categoryId) => {
    loading.value = true;
    try {
      notes.value = await db.notes
        .where('categoryId')
        .equals(categoryId)
        .reverse()
        .sortBy('time');
    } catch (error) {
      ElMessage.error('加载笔记失败');
      console.error(error);
    } finally {
      loading.value = false;
    }
  };

  const loadNote = async (id) => {
    try {
      return await db.notes.get(id);
    } catch (error) {
      ElMessage.error('加载笔记失败');
      console.error(error);
      return null;
    }
  };

  const addNote = async (note) => {
    try {
      const id = await db.notes.add({
        ...note,
        time: new Date(note.time).toISOString()
      });
      ElMessage.success('笔记保存成功');
      return id;
    } catch (error) {
      ElMessage.error('保存笔记失败');
      console.error(error);
      return null;
    }
  };

  const updateNote = async (id, note) => {
    try {
      await db.notes.update(id, {
        ...note,
        time: new Date(note.time).toISOString()
      });
      ElMessage.success('笔记更新成功');
      return true;
    } catch (error) {
      ElMessage.error('更新笔记失败');
      console.error(error);
      return false;
    }
  };

  const deleteNote = async (id) => {
    try {
      await db.notes.delete(id);
      ElMessage.success('笔记删除成功');
      return true;
    } catch (error) {
      ElMessage.error('删除笔记失败');
      console.error(error);
      return false;
    }
  };

  const searchNotes = async (keyword) => {
    loading.value = true;
    try {
      if (!keyword || !keyword.trim()) {
        notes.value = [];
        return;
      }
      const allNotes = await db.notes.toArray();
      const categories = await db.categories.toArray();
      const categoryMap = new Map(categories.map(c => [c.id, c.title]));

      const lowerKeyword = keyword.toLowerCase();
      notes.value = allNotes
        .filter(note => {
          const categoryName = categoryMap.get(note.categoryId) || '';
          return (
            note.title?.toLowerCase().includes(lowerKeyword) ||
            note.learned?.toLowerCase().includes(lowerKeyword) ||
            note.doubt?.toLowerCase().includes(lowerKeyword) ||
            note.nextGoal?.toLowerCase().includes(lowerKeyword) ||
            categoryName?.toLowerCase().includes(lowerKeyword)
          );
        })
        .map(note => ({
          ...note,
          categoryName: categoryMap.get(note.categoryId) || '未分类'
        }))
        .sort((a, b) => new Date(b.time) - new Date(a.time));
    } catch (error) {
      ElMessage.error('搜索失败');
      console.error(error);
    } finally {
      loading.value = false;
    }
  };

  return {
    notes,
    loading,
    loadNotesByCategory,
    loadNote,
    addNote,
    updateNote,
    deleteNote,
    searchNotes
  };
}
