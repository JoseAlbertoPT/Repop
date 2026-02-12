// lib/swalUtils.ts
import Swal from 'sweetalert2';

// Configuración de temas personalizados
const customStyles = {
  confirmButton: '#3085d6',
  cancelButton: '#d33',
  successButton: '#28a745',
  deleteButton: '#dc3545',
};

/**
 * Alerta de confirmación para eliminar
 */
export const confirmDelete = async (itemName: string = 'este registro') => {
  return Swal.fire({
    title: '¿Estás seguro?',
    text: `¡No podrás revertir esto! Se eliminará ${itemName}.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: customStyles.deleteButton,
    cancelButtonColor: customStyles.cancelButton,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
  });
};

/**
 * Alerta de éxito genérica
 */
export const showSuccess = (title: string, message?: string) => {
  return Swal.fire({
    title: title,
    text: message,
    icon: 'success',
    confirmButtonColor: customStyles.successButton,
    confirmButtonText: 'Aceptar',
    timer: 2500,
    timerProgressBar: true,
  });
};

/**
 * Alerta de error genérica
 */
export const showError = (title: string = 'Error', message: string = 'Algo salió mal') => {
  return Swal.fire({
    title: title,
    text: message,
    icon: 'error',
    confirmButtonColor: customStyles.confirmButton,
    confirmButtonText: 'Aceptar',
  });
};

/**
 * Alerta de guardando/procesando con spinner
 */
export const showLoading = (title: string = 'Guardando...', message?: string) => {
  Swal.fire({
    title: title,
    text: message,
    icon: 'info',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

/**
 * Cerrar alerta de loading
 */
export const closeLoading = () => {
  Swal.close();
};

/**
 * Alerta de confirmación para guardar cambios
 */
export const confirmSave = async (message: string = '¿Deseas guardar los cambios?') => {
  return Swal.fire({
    title: '¿Estás seguro?',
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: customStyles.successButton,
    cancelButtonColor: customStyles.cancelButton,
    confirmButtonText: 'Sí, guardar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
  });
};

/**
 * Alerta de confirmación para actualizar
 */
export const confirmUpdate = async (itemName: string = 'este registro') => {
  return Swal.fire({
    title: '¿Guardar cambios?',
    text: `Se actualizará ${itemName}`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: customStyles.successButton,
    cancelButtonColor: customStyles.cancelButton,
    confirmButtonText: 'Sí, actualizar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
  });
};

/**
 * Toast - Notificación pequeña en esquina
 */
export const showToast = (icon: 'success' | 'error' | 'warning' | 'info', title: string) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

  Toast.fire({
    icon: icon,
    title: title,
  });
};