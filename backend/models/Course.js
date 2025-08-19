import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['AWS', 'Kubernetes', 'Docker', 'Linux', 'Ansible', 'GCP']
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  duration: {
    type: String, // e.g., "2 hours", "5 days"
    required: true
  },
  thumbnail: {
    type: String,
    // default: 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg'
    default: 'https://drive.google.com/file/d/1lK9nzgGXQEretgvBoEUYniPw0bGTosHt/view?usp=drive_link'



  },
  playlist: [{
    title: String,
    src: String,
    duration: String,
    order: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Course', courseSchema);