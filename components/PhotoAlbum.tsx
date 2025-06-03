'use client';
import { useState } from 'react';

const PhotoAlbum = () => {
  const [currentPage, setCurrentPage] = useState(0);

  const pages = [
    { image: 'https://picsum.photos/600/400?random=1', caption: 'Hình ảnh thiên nhiên tuyệt đẹp với núi non hùng vĩ.' },
    { image: 'https://picsum.photos/600/400?random=2', caption: 'Bình minh rực rỡ trên bãi biển yên bình.' },
    { image: 'https://picsum.photos/600/400?random=3', caption: 'Rừng xanh mát với ánh nắng xuyên qua tán lá.' },
    { image: 'https://picsum.photos/600/400?random=4', caption: 'Thành phố về đêm lung linh ánh đèn.' },
    { image: 'https://picsum.photos/600/400?random=5', caption: 'Hoa lá mùa xuân rực rỡ sắc màu.' },
    { image: 'https://picsum.photos/600/400?random=6', caption: 'Phong cảnh mùa thu với lá vàng lả tả.' },
  ];

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem 1rem',
      marginTop: '2rem'
    }}>
      <h2 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#d81b60',
        marginBottom: '2rem',
        textShadow: '1px 1px 2px #ff8ba7',
        fontFamily: "'Comic Sans MS', cursive, sans-serif"
      }}>
        Album Kỷ Niệm 💝
      </h2>

      <div style={{ position: 'relative' }}>
        {/* Sách */}
        <div style={{
          background: 'linear-gradient(135deg, #d81b60, #ad1457)',
          padding: '6px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(216, 27, 96, 0.3), 0 0 20px rgba(255, 182, 193, 0.2)'
        }}>
          <div style={{
            background: 'white',
            width: '400px',
            height: '280px',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
          }}>

            {/* Gáy sách */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '16px',
              height: '100%',
              background: 'linear-gradient(to right, #ad1457, #d81b60)',
              borderRadius: '8px 0 0 8px'
            }}></div>

            {/* Nội dung trang */}
            <div style={{
              marginLeft: '16px',
              padding: '1.5rem',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #fff0f3, #ffe4e7)',
                borderRadius: '8px',
                padding: '1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                border: '1px solid #ffcdd2',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <img
                  src={pages[currentPage].image}
                  alt={`Ảnh ${currentPage + 1}`}
                  style={{
                    width: '100%',
                    height: '140px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: '2px solid white'
                  }}
                />
                <p
                  style={{
                    color: '#6a1b4d',
                    textAlign: 'center',
                    fontStyle: 'italic',
                    fontSize: '0.9rem',
                    lineHeight: '1.4',
                    fontFamily: "'Comic Sans MS', cursive, sans-serif",
                    maxWidth: '100%',
                    whiteSpace: 'nowrap',     // 1 dòng duy nhất
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: 'pointer',
                    margin: 0,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.whiteSpace = 'normal';
                    e.currentTarget.style.overflow = 'visible';
                    e.currentTarget.style.textOverflow = 'unset';
                    e.currentTarget.style.backgroundColor = '#fff0f3'; // Optional: highlight khi hover
                    e.currentTarget.style.padding = '0.2rem 0.4rem';
                    e.currentTarget.style.borderRadius = '4px';
                    e.currentTarget.style.position = 'relative';
                    e.currentTarget.style.zIndex = '10';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(216, 27, 96, 0.3)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.whiteSpace = 'nowrap';
                    e.currentTarget.style.overflow = 'hidden';
                    e.currentTarget.style.textOverflow = 'ellipsis';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.padding = '0';
                    e.currentTarget.style.borderRadius = '0';
                    e.currentTarget.style.position = 'static';
                    e.currentTarget.style.zIndex = 'auto';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {pages[currentPage].caption}
                </p>
              </div>

              {/* Số trang */}
              <div style={{
                textAlign: 'right',
                fontSize: '0.8rem',
                color: '#ad1457',
                marginTop: '0.5rem',
                fontWeight: 'bold'
              }}>
                {currentPage + 1} / {pages.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nút điều khiển */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginTop: '1.5rem'
      }}>
        <button
          onClick={prevPage}
          disabled={currentPage === 0}
          style={{
            padding: '10px 20px',
            background: currentPage === 0
              ? 'linear-gradient(135deg, #ffcdd2, #f8bbd9)'
              : 'linear-gradient(135deg, #d81b60, #ad1457)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 0 ? 0.5 : 1,
            transition: 'all 0.3s ease',
            fontFamily: "'Comic Sans MS', cursive, sans-serif",
            fontWeight: 'bold',
            fontSize: '0.9rem',
            boxShadow: currentPage === 0
              ? 'none'
              : '0 4px 12px rgba(216, 27, 96, 0.3)'
          }}
          onMouseEnter={(e) => {
            if (currentPage !== 0) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(216, 27, 96, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 0) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(216, 27, 96, 0.3)';
            }
          }}
        >
          💕 Trước
        </button>
        <button
          onClick={nextPage}
          disabled={currentPage === pages.length - 1}
          style={{
            padding: '10px 20px',
            background: currentPage === pages.length - 1
              ? 'linear-gradient(135deg, #ffcdd2, #f8bbd9)'
              : 'linear-gradient(135deg, #d81b60, #ad1457)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: currentPage === pages.length - 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === pages.length - 1 ? 0.5 : 1,
            transition: 'all 0.3s ease',
            fontFamily: "'Comic Sans MS', cursive, sans-serif",
            fontWeight: 'bold',
            fontSize: '0.9rem',
            boxShadow: currentPage === pages.length - 1
              ? 'none'
              : '0 4px 12px rgba(216, 27, 96, 0.3)'
          }}
          onMouseEnter={(e) => {
            if (currentPage !== pages.length - 1) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(216, 27, 96, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== pages.length - 1) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(216, 27, 96, 0.3)';
            }
          }}
        >
          Sau 💕
        </button>
      </div>

      <p style={{
        color: '#ad1457',
        fontSize: '0.8rem',
        marginTop: '1rem',
        fontStyle: 'italic',
        opacity: 0.8,
        fontFamily: "'Comic Sans MS', cursive, sans-serif"
      }}>
        Nhấn nút để xem ảnh tiếp theo ✨
      </p>
    </div>
  );
};

export default PhotoAlbum;