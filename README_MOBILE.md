# Nigeria Tax Hub - Mobile App Setup

This project is now configured for mobile app development using Capacitor!

## Mobile App Features

The Nigeria Tax Hub mobile app includes:
- ✅ Quick tax calculators (PIT, CIT, CGT, VAT)
- ✅ Expense capture with camera integration
- ✅ Compliance deadline reminders
- ✅ AI Tax Advisor on-the-go
- ✅ Offline access to key features
- ✅ Push notifications for deadlines

## Getting Started

### Prerequisites
- Node.js and npm installed
- For iOS: Mac with Xcode installed
- For Android: Android Studio installed

### Setup Instructions

1. **Clone the project from GitHub**
   - Click "Export to GitHub" in Lovable
   - Clone your repository: `git clone <your-repo-url>`
   - Navigate to project: `cd nigeria-tax-hub`

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add mobile platforms**
   ```bash
   # For Android
   npx cap add android
   
   # For iOS (Mac only)
   npx cap add ios
   ```

4. **Update native dependencies**
   ```bash
   # For Android
   npx cap update android
   
   # For iOS
   npx cap update ios
   ```

5. **Build the web app**
   ```bash
   npm run build
   ```

6. **Sync with native platforms**
   ```bash
   npx cap sync
   ```

7. **Run on device/emulator**
   ```bash
   # For Android
   npx cap run android
   
   # For iOS (Mac only)
   npx cap run ios
   ```

## Development Workflow

When making changes to the app:

1. Make your changes in the code
2. Git pull the latest changes
3. Run `npm install` if dependencies changed
4. Run `npm run build` to build the web app
5. Run `npx cap sync` to sync with native platforms
6. Run `npx cap run android` or `npx cap run ios` to test

## Hot Reload

The app is configured for hot reload during development. When you run the app, it will connect to your Lovable sandbox URL, so you can make changes in Lovable and see them immediately on your mobile device.

## Capacitor Configuration

The app is configured with:
- **App ID**: `app.lovable.904ea04ccdeb4da09856be580c3bfc2e`
- **App Name**: Nigeria Tax Hub
- **Server URL**: Points to your Lovable sandbox for hot reload

## Recommended Plugins

Consider adding these Capacitor plugins for enhanced functionality:

- `@capacitor/camera` - For expense receipt capture
- `@capacitor/local-notifications` - For deadline reminders
- `@capacitor/storage` - For offline data storage
- `@capacitor/share` - For sharing tax calculations
- `@capacitor/filesystem` - For document management

Install plugins with:
```bash
npm install @capacitor/camera
npx cap sync
```

## Troubleshooting

**Build fails:**
- Make sure you've run `npm install`
- Check that `npm run build` completes successfully
- Try `npx cap clean` then sync again

**Can't find module errors:**
- Run `npm install` in the project root
- Make sure all dependencies are installed

**iOS build fails:**
- Ensure you're on a Mac with Xcode installed
- Open the project in Xcode and check for signing issues
- Make sure you have a valid Apple Developer account

**Android build fails:**
- Ensure Android Studio is properly installed
- Check that you have the required SDK versions
- Open the project in Android Studio to see detailed errors

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Lovable Mobile Development Guide](https://docs.lovable.dev/features/mobile)
- [Nigeria Tax Hub Documentation](./README.md)

## Support

For issues specific to:
- Mobile app development: Check Capacitor docs
- Tax calculations: Refer to Nigeria Tax Act 2025
- General app issues: Contact support@lovable.dev
