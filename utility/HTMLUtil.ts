import { t } from "@/i18n";
import { UserPresence } from "@/repository/userRepository";

// Utility function to generate attendance HTML for PDF
export function generateAttendanceHtml({
    title,
    logoBase64,
    description,
    date,
    numberPresenceORSubscribed = 0,
    numberAbsentsORUnSubscribed = 0,
    numberCheckout = 0,
    numberNoCheckout = 0,
    userFilter,
}: {
    title: string;
    logoBase64: string;
    description: string;
    date: string;
    numberPresenceORSubscribed?: number;
    numberAbsentsORUnSubscribed?: number;
    numberCheckout?: number;
    numberNoCheckout?: number;
    userFilter: UserPresence[];
}) {
    // Divide os usuários em páginas de 28 linhas
    const pageSize = 28;
    const pages = [];
    for (let i = 0; i < userFilter.length; i += pageSize) {
        pages.push(userFilter.slice(i, i + pageSize));
    }
    return `
        <html>
        <head>
            <style>
                @page { size: A4; }
                body { font-family: Arial, sans-serif; margin: 24px; margin-bottom: 60px; }
                .header { text-align: center; margin-bottom: 16px; }
                .logo { width: 80px; height: 40px; margin-bottom: 8px; }
                .title { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
                .subtitle { font-size: 14px; margin-bottom: 8px; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                th, td { border: 1px solid #ccc; padding: 6px 4px; font-size: 12px; text-align: left; }
                th { background: #f0f0f0; }
                .present { color: #2ecc40; font-weight: bold; }
                .absent { color: #e74c3c; font-weight: bold; }
                .footer { width: 100%; margin-top: 32px; text-align: center; font-size: 11px; color: #888; }
                .page-break { page-break-after: always; }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="${logoBase64}" class="logo" />
                <div class="title">${title}</div>
                <div class="subtitle">${
                    title === t('events.subscriptionList')
                        ? `${t('events.firstPortion')} ${t('events.subscribed')}: ${numberPresenceORSubscribed} | ${t('events.firstPortion')} ${t('events.notSubscribed')}: ${numberAbsentsORUnSubscribed} | ${t('events.secondPortion')} ${t('events.subscribed')}: ${userFilter.filter(u => u.hasSecondPortion).length} | ${t('events.secondPortion')} ${t('events.notSubscribed')}: ${userFilter.filter(u => !u.hasSecondPortion).length}`
                        : `${t('events.checkinDone')}: ${numberPresenceORSubscribed} | ${t('events.checkinNotDone')}: ${numberAbsentsORUnSubscribed} | ${t('events.checkoutDone')}: ${numberCheckout} | ${t('events.checkoutNotDone')}: ${numberNoCheckout}`
                }</div>
                <div class="subtitle">${description || ""} - ${date || ""}</div>
            </div>
            <table>
                <tr>
                    <th>#</th>
                    <th>Nome Completo</th>
                    <th>Login</th>
                    ${
                        title === t('events.subscriptionList')
                            ? "<th>Primeira via</th><th>Segunda via</th>"
                            : "<th>Check-in</th><th>Check-out</th>"
                    }
                </tr>
                ${pages[0]
                    .map(
                        (u, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${u.displayname}</td>
                        <td>${u.login}</td>
                        ${
                            title === t('events.subscriptionList')
                                ? `<td class="${
                                      u.hasFirstPortion ? "present" : "absent"
                                  }">${
                                      u.hasFirstPortion ? t('events.subscribed') : t('events.notSubscribed')
                                  }</td>
                                  <td class="${
                                      u.hasSecondPortion ? "present" : "absent"
                                  }">${
                                      u.hasSecondPortion ? t('events.subscribed') : t('events.notSubscribed')
                                  }</td>`
                                : `<td class="${
                                      u.hasCheckin ? "present" : "absent"
                                  }">${
                                      u.hasCheckin ? t('events.present') : t('events.absent')
                                  }</td>
                                  <td class="${
                                      u.hasCheckout ? "present" : "absent"
                                  }">${
                                      u.hasCheckout ? t('events.present') : t('events.absent')
                                  }</td>`
                        }
                    </tr>
                `
                    )
                    .join("")}
            </table>
            <div class="footer">Lista de presença gerada em ${new Date().toLocaleString()}</div>
            ${pages
                .slice(1)
                .map(
                    (page, pageIndex) => `
                <table>
                    <tr>
                        <th>#</th>
                        <th>${t('events.fullName')}</th>
                        <th>Login</th>
                        ${
                            title === t('events.subscriptionList')
                                ? `<th>${t('events.firstPortion')}</th><th>${t('events.secondPortion')}</th>`
                                : `<th>${t('events.checkIn')}</th><th>${t('events.checkOut')}</th>`
                        }
                    </tr>
                    ${page
                        .map(
                            (u, i) => `
                        <tr>
                            <td>${(pageIndex + 1) * pageSize + i + 1}</td>
                            <td>${u.displayname}</td>
                            <td>${u.login}</td>
                           ${
                               title === t('events.subscriptionList')
                                   ? `<td class="${
                                         u.hasFirstPortion ? "present" : "absent"
                                     }">${
                                         u.hasFirstPortion ? t('events.subscribed') : t('events.notSubscribed')
                                     }</td>
                                     <td class="${
                                         u.hasSecondPortion ? "present" : "absent"
                                     }">${
                                         u.hasSecondPortion ? t('events.subscribed') : t('events.notSubscribed')
                                     }</td>`
                                   : `<td class="${
                                         u.hasCheckin ? "present" : "absent"
                                     }">${
                                         u.hasCheckin ? t('events.present') : t('events.absent')
                                     }</td>
                                     <td class="${
                                         u.hasCheckout ? "present" : "absent"
                                     }">${
                                         u.hasCheckout ? t('events.present') : t('events.absent')
                                     }</td>`
                           }
                        </tr>
                    `
                        )
                        .join("")}
                </table>
                <div class="footer">${title} ${t('common.generatedAt')} ${new Date().toLocaleString()}</div>
                ${
                    pageIndex < pages.length - 2
                        ? '<div class="page-break"></div>'
                        : ""
                }
            `
                )
                .join("")}
        </body>
        </html>
        `;
}
